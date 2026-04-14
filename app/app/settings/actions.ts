"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/auth";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";

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
  const provider = String(formData.get("provider") ?? "");
  // signIn redirects to the OAuth consent screen; DrizzleAdapter links the
  // new OAuth account to the signed-in user on return.
  await signIn(provider, { redirectTo: "/app/settings/channels" });
}

export async function disconnectChannel(formData: FormData) {
  const userId = await requireUserId();
  const provider = String(formData.get("provider") ?? "");
  if (!provider) return;

  await db
    .delete(accounts)
    .where(
      and(eq(accounts.userId, userId), eq(accounts.provider, provider)),
    );

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
}
