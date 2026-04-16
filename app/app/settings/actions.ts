"use server";

import { and, eq, notInArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/auth";
import { db } from "@/db";
import { accounts, users, blueskyCredentials } from "@/db/schema";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { canConnectAnotherChannel, getEntitlements } from "@/lib/billing/entitlements";
import { syncChannelQuantity } from "@/lib/billing/service";
import { AtpAgent } from "@atproto/api";

const VALID_ROLES = [
  "solo",
  "creator",
  "team",
  "agency",
  "nonprofit",
] as const;
type Role = (typeof VALID_ROLES)[number];
const isRole = (v: unknown): v is Role =>
  typeof v === "string" && (VALID_ROLES as readonly string[]).includes(v);

const isValidTimezone = (tz: string) => {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim() || null;
  const workspaceName =
    String(formData.get("workspaceName") ?? "").trim() || null;
  const roleRaw = formData.get("role");
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (workspaceName && workspaceName.length > 60) {
    throw new Error("Workspace name must be 60 characters or fewer.");
  }
  const role = isRole(roleRaw) ? roleRaw : null;
  const tz = isValidTimezone(timezone) ? timezone : null;

  await db
    .update(users)
    .set({
      name,
      workspaceName,
      role,
      timezone: tz,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/app", "layout");
  redirect("/app/settings/profile?saved=1");
}

export async function connectChannel(formData: FormData) {
  const userId = await requireUserId();
  const provider = String(formData.get("provider") ?? "");
  if (!provider) return;

  // Enforce the free-tier channel limit server-side. The UI disables the
  // button past the limit, but a malicious request would sail through
  // without this gate.
  const connected = await currentChannelCount(userId);
  const entitlements = await getEntitlements(userId, connected);
  if (!canConnectAnotherChannel(entitlements)) {
    redirect("/app/settings/channels?limit=1");
  }

  // signIn redirects to the OAuth consent screen; DrizzleAdapter links the
  // new OAuth account to the signed-in user on return.
  await signIn(provider, { redirectTo: "/app/settings/channels" });
}

export async function disconnectChannel(formData: FormData) {
  const userId = await requireUserId();
  const provider = String(formData.get("provider") ?? "");
  if (!provider) return;

  if (provider === "bluesky") {
    await disconnectBluesky();
    return;
  }

  await db
    .delete(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.provider, provider)),
    );

  const remaining = await currentChannelCount(userId);
  try {
    await syncChannelQuantity(userId, Math.max(1, remaining));
  } catch (err) {
    console.error("[channels] failed to sync seat count after disconnect", err);
  }

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
}

async function currentChannelCount(userId: string): Promise<number> {
  const [oauthRows, blueskyRow] = await Promise.all([
    db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
    db
      .select({ id: blueskyCredentials.id })
      .from(blueskyCredentials)
      .where(eq(blueskyCredentials.userId, userId))
      .limit(1),
  ]);
  return oauthRows.length + (blueskyRow ? 1 : 0);
}

export async function connectBluesky(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const userId = await requireUserId();

  const handle = String(formData.get("handle") ?? "").trim();
  const appPassword = String(formData.get("appPassword") ?? "").trim();

  if (!handle || !appPassword) {
    return { error: "Handle and app password are required." };
  }

  const connected = await currentChannelCount(userId);
  const entitlements = await getEntitlements(userId, connected);
  if (!canConnectAnotherChannel(entitlements)) {
    redirect("/app/settings/channels?limit=1");
  }

  let agent;
  try {
    agent = new AtpAgent({ service: "https://bsky.social" });
    await agent.login({
      identifier: handle,
      password: appPassword,
    });
  } catch (err) {
    console.error("[bluesky] login failed", err);
    return {
      error: "Invalid handle or app password. Please check your credentials and try again.",
    };
  }

  const did = agent.session?.did ?? null;

  await db
    .insert(blueskyCredentials)
    .values({
      userId,
      handle,
      appPassword,
      did,
    })
    .onConflictDoUpdate({
      target: blueskyCredentials.userId,
      set: {
        handle,
        appPassword,
        did,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
  redirect("/app/settings/channels?connected=bluesky");
}

export async function disconnectBluesky() {
  const userId = await requireUserId();

  await db
    .delete(blueskyCredentials)
    .where(eq(blueskyCredentials.userId, userId));

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
}
