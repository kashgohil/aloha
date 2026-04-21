"use server";

import { and, eq, notInArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, signIn, unstable_update } from "@/auth";
import { db } from "@/db";
import { accounts, users, blueskyCredentials, mastodonCredentials, telegramCredentials, channelNotifications } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { channelNotificationEmail } from "@/lib/email/templates/channel-notification";
import { channelLabel } from "@/components/channel-chip";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { canConnectAnotherChannel, getEntitlements } from "@/lib/billing/entitlements";
import { syncChannelQuantity } from "@/lib/billing/service";
import { setChannelPublishMode, type PublishMode } from "@/lib/channel-state";
import { AtpAgent } from "@atproto/api";
import { startTelegramAuth, completeTelegramAuth } from "@/lib/publishers/telegram";

const VALID_PUBLISH_MODES: readonly PublishMode[] = [
  "auto",
  "review_pending",
  "manual_assist",
] as const;
const isPublishMode = (v: unknown): v is PublishMode =>
  typeof v === "string" &&
  (VALID_PUBLISH_MODES as readonly string[]).includes(v);

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

  await unstable_update({ user: {} });
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

  if (provider === "mastodon") {
    await disconnectMastodon();
    return;
  }

  if (provider === "telegram") {
    await disconnectTelegram();
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
  const [oauthRows, blueskyRow, mastodonRow, telegramRow] = await Promise.all([
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
    db
      .select({ id: mastodonCredentials.id })
      .from(mastodonCredentials)
      .where(eq(mastodonCredentials.userId, userId))
      .limit(1),
    db
      .select({ id: telegramCredentials.id })
      .from(telegramCredentials)
      .where(eq(telegramCredentials.userId, userId))
      .limit(1),
  ]);
  return (
    oauthRows.length +
    blueskyRow.length +
    mastodonRow.length +
    telegramRow.length
  );
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

export async function connectMastodon(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const userId = await requireUserId();

  const instanceUrl = String(formData.get("instanceUrl") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();

  if (!instanceUrl || !accessToken) {
    return { error: "Instance URL and access token are required." };
  }

  let normalizedInstance = instanceUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!normalizedInstance) {
    return { error: "Invalid instance URL." };
  }

  const connected = await currentChannelCount(userId);
  const entitlements = await getEntitlements(userId, connected);
  if (!canConnectAnotherChannel(entitlements)) {
    redirect("/app/settings/channels?limit=1");
  }

  const instanceBase = `https://${normalizedInstance}`;

  let accountId = "";
  let username = "";
  try {
    const res = await fetch(`${instanceBase}/api/v1/accounts/verify_credentials`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[mastodon] verify_credentials failed", res.status, detail);
      return {
        error: "Invalid access token or instance URL. Please check your credentials.",
      };
    }
    const data = (await res.json()) as { id: string; username: string };
    accountId = data.id;
    username = data.username;
  } catch (err) {
    console.error("[mastodon] API call failed", err);
    return {
      error: "Could not connect to the instance. Please check the URL and try again.",
    };
  }

  await db
    .insert(mastodonCredentials)
    .values({
      userId,
      instanceUrl: instanceBase,
      accessToken,
      accountId,
      username,
    })
    .onConflictDoUpdate({
      target: mastodonCredentials.userId,
      set: {
        instanceUrl: instanceBase,
        accessToken,
        accountId,
        username,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
  redirect("/app/settings/channels?connected=mastodon");
}

export async function disconnectMastodon() {
  const userId = await requireUserId();

  await db
    .delete(mastodonCredentials)
    .where(eq(mastodonCredentials.userId, userId));

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
}

export async function connectTelegram(
  _prevState: { error?: string; needsCode?: boolean; needsPassword?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; needsCode?: boolean; needsPassword?: boolean } | null> {
  const userId = await requireUserId();

  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const chatId = String(formData.get("chatId") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim() || null;
  const phoneCode = String(formData.get("phoneCode") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim() || undefined;

  if (!phoneNumber || !chatId) {
    return { error: "Phone number and chat ID are required." };
  }

  const connected = await currentChannelCount(userId);
  const entitlements = await getEntitlements(userId, connected);
  if (!canConnectAnotherChannel(entitlements)) {
    redirect("/app/settings/channels?limit=1");
  }

  // If we have a phone code, complete the authentication
  if (phoneCode) {
    const { success, error, needsPassword } = await completeTelegramAuth(userId, phoneCode, password);
    if (!success) {
      if (needsPassword) {
        return { error: undefined, needsPassword: true };
      }
      return { error: error || "Failed to verify code" };
    }
    revalidatePath("/app/settings/channels");
    revalidatePath("/app/dashboard");
    redirect("/app/settings/channels?connected=telegram");
  }

  // Start new authentication flow
  const { success, needsCode, error } = await startTelegramAuth(
    userId,
    phoneNumber,
    chatId,
    username || undefined,
  );

  if (!success) {
    return { error: error || "Failed to start authentication" };
  }

  if (needsCode) {
    return { needsCode: true };
  }

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
  redirect("/app/settings/channels?connected=telegram");
}

export async function disconnectTelegram() {
  const userId = await requireUserId();

  await db
    .delete(telegramCredentials)
    .where(eq(telegramCredentials.userId, userId));

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
}

// Channel state machine (§8). Lets a user pick how a gated platform behaves —
// silent queue (`review_pending`) vs. reminder-me mode (`manual_assist`) —
// or leave it on `auto` which defers to the platform's current gating status.
export async function updateChannelPublishMode(formData: FormData) {
  const userId = await requireUserId();
  const channel = String(formData.get("channel") ?? "");
  const mode = formData.get("mode");

  if (!channel) throw new Error("channel is required");
  if (!isPublishMode(mode)) throw new Error("invalid publish mode");

  await setChannelPublishMode(userId, channel, mode);
  revalidatePath("/app/settings/channels");
}

export async function updateNotificationPreferences(formData: FormData) {
  const userId = await requireUserId();

  await db
    .update(users)
    .set({
      notificationsEnabled: formData.get("notificationsEnabled") === "on",
      notifyPostOutcomes: formData.get("notifyPostOutcomes") === "on",
      notifyInboxSyncIssues: formData.get("notifyInboxSyncIssues") === "on",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  redirect("/app/settings/notifications?saved=1");
}

// Notify user when a platform becomes available for connection.
// Stores their interest and emails them a confirmation. Subsequent clicks
// for the same channel are no-ops (no duplicate confirmations).
export async function notifyWhenAvailable(formData: FormData) {
  const userId = await requireUserId();
  const provider = String(formData.get("provider") ?? "");
  if (!provider) throw new Error("provider is required");

  const inserted = await db
    .insert(channelNotifications)
    .values({ userId, channel: provider })
    .onConflictDoNothing({
      target: [channelNotifications.userId, channelNotifications.channel],
    })
    .returning({ id: channelNotifications.id });

  if (inserted.length > 0) {
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.email) {
      const tpl = channelNotificationEmail({
        name: user.name,
        channelLabel: channelLabel(provider),
      });
      try {
        await sendEmail({ to: user.email, ...tpl });
      } catch (err) {
        console.error("[notify] confirmation email failed", err);
      }
    }
  }

  revalidatePath("/app/settings/channels");
}
