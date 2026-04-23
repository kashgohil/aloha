"use server";

import { and, eq, notInArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, signIn, unstable_update } from "@/auth";
import { db } from "@/db";
import { accounts, users, blueskyCredentials, mastodonCredentials, telegramCredentials, channelNotifications, channelProfiles } from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { channelNotificationEmail } from "@/lib/email/templates/channel-notification";
import { channelLabel } from "@/components/channel-chip";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { canConnectAnotherChannel, getEntitlements } from "@/lib/billing/entitlements";
import { syncChannelQuantity } from "@/lib/billing/service";
import { setChannelPublishMode, type PublishMode } from "@/lib/channel-state";
import { AtpAgent } from "@atproto/api";
import { startTelegramAuth, completeTelegramAuth } from "@/lib/publishers/telegram";
import { upsertChannelProfile, refreshChannelProfile } from "@/lib/channels/profiles";
import { requireContext } from "@/lib/current-context";

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

async function requireWorkspace() {
  const ctx = await requireContext();
  return { userId: ctx.user.id, workspaceId: ctx.workspace.id };
}

export async function updateProfile(formData: FormData) {
  const { userId, workspaceId } = await requireWorkspace();

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
  const { userId, workspaceId } = await requireWorkspace();
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

// Refresh cached profile details for a connected channel. Uses the stored
// token/credentials — no OAuth redirect — so it can't swap to a different
// account or bump the user past their seat limit. Best-effort: silent if
// the fetch fails, revalidates so the refresh icon stops spinning.
export async function refreshChannelProfileAction(formData: FormData) {
  const { userId, workspaceId } = await requireWorkspace();
  const provider = String(formData.get("provider") ?? "");
  if (!provider) return;

  // Only refresh channels the user actually has connected. Prevents a
  // rogue form from triggering API calls for arbitrary channels.
  if (provider === "bluesky") {
    const [row] = await db
      .select({ id: blueskyCredentials.id })
      .from(blueskyCredentials)
      .where(eq(blueskyCredentials.workspaceId, workspaceId))
      .limit(1);
    if (!row) return;
  } else if (provider === "mastodon") {
    const [row] = await db
      .select({ id: mastodonCredentials.id })
      .from(mastodonCredentials)
      .where(eq(mastodonCredentials.workspaceId, workspaceId))
      .limit(1);
    if (!row) return;
  } else if (provider === "telegram") {
    const [row] = await db
      .select({ id: telegramCredentials.id })
      .from(telegramCredentials)
      .where(eq(telegramCredentials.workspaceId, workspaceId))
      .limit(1);
    if (!row) return;
  } else {
    const [row] = await db
      .select({ providerAccountId: accounts.providerAccountId })
      .from(accounts)
      .where(and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, provider)))
      .limit(1);
    if (!row) return;
  }

  await refreshChannelProfile(userId, provider);
  revalidatePath("/app/settings/channels");
}

export async function disconnectChannel(formData: FormData) {
  const { userId, workspaceId } = await requireWorkspace();
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
      and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, provider)),
    );
  await db
    .delete(channelProfiles)
    .where(
      and(
        eq(channelProfiles.workspaceId, workspaceId),
        eq(channelProfiles.channel, provider),
      ),
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
  const [userRow] = await db
    .select({ workspaceId: users.activeWorkspaceId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const workspaceId = userRow?.workspaceId ?? null;
  if (!workspaceId) return 0;
  const [oauthRows, blueskyRow, mastodonRow, telegramRow] = await Promise.all([
    db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.workspaceId, workspaceId),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
    db
      .select({ id: blueskyCredentials.id })
      .from(blueskyCredentials)
      .where(eq(blueskyCredentials.workspaceId, workspaceId))
      .limit(1),
    db
      .select({ id: mastodonCredentials.id })
      .from(mastodonCredentials)
      .where(eq(mastodonCredentials.workspaceId, workspaceId))
      .limit(1),
    db
      .select({ id: telegramCredentials.id })
      .from(telegramCredentials)
      .where(eq(telegramCredentials.workspaceId, workspaceId))
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
  const { userId, workspaceId } = await requireWorkspace();

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

  // Fetch the profile so the UI can show avatar + display name. Best-effort.
  let profile: {
    displayName?: string;
    avatar?: string;
    description?: string;
    followersCount?: number;
  } | null = null;
  try {
    const res = await agent.getProfile({ actor: handle });
    profile = res.data;
  } catch (err) {
    console.error("[bluesky] getProfile failed", err);
  }

  await db
    .insert(blueskyCredentials)
    .values({
      userId,
      workspaceId,
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

  await upsertChannelProfile(userId, "bluesky", {
    providerAccountId: did,
    displayName: profile?.displayName ?? handle,
    handle,
    avatarUrl: profile?.avatar ?? null,
    profileUrl: `https://bsky.app/profile/${handle}`,
    bio: profile?.description ?? null,
    followerCount: profile?.followersCount ?? null,
  });

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
  redirect("/app/settings/channels?connected=bluesky");
}

export async function disconnectBluesky() {
  const { userId, workspaceId } = await requireWorkspace();

  await db
    .delete(blueskyCredentials)
    .where(eq(blueskyCredentials.workspaceId, workspaceId));
  await db
    .delete(channelProfiles)
    .where(
      and(
        eq(channelProfiles.workspaceId, workspaceId),
        eq(channelProfiles.channel, "bluesky"),
      ),
    );

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
}

export async function connectMastodon(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const { userId, workspaceId } = await requireWorkspace();

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
  let mastodonProfile: {
    displayName?: string;
    avatar?: string;
    url?: string;
    note?: string;
    followersCount?: number;
  } = {};
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
    const data = (await res.json()) as {
      id: string;
      username: string;
      display_name?: string;
      avatar?: string;
      avatar_static?: string;
      url?: string;
      note?: string;
      followers_count?: number;
    };
    accountId = data.id;
    username = data.username;
    mastodonProfile = {
      displayName: data.display_name,
      avatar: data.avatar ?? data.avatar_static,
      url: data.url,
      note: data.note,
      followersCount: data.followers_count,
    };
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
      workspaceId,
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

  await upsertChannelProfile(userId, "mastodon", {
    providerAccountId: accountId,
    displayName: mastodonProfile.displayName || username,
    handle: `@${username}@${normalizedInstance}`,
    avatarUrl: mastodonProfile.avatar ?? null,
    profileUrl: mastodonProfile.url ?? `${instanceBase}/@${username}`,
    bio: mastodonProfile.note ?? null,
    followerCount: mastodonProfile.followersCount ?? null,
  });

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
  redirect("/app/settings/channels?connected=mastodon");
}

export async function disconnectMastodon() {
  const { userId, workspaceId } = await requireWorkspace();

  await db
    .delete(mastodonCredentials)
    .where(eq(mastodonCredentials.workspaceId, workspaceId));
  await db
    .delete(channelProfiles)
    .where(
      and(
        eq(channelProfiles.workspaceId, workspaceId),
        eq(channelProfiles.channel, "mastodon"),
      ),
    );

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
}

export async function connectTelegram(
  _prevState: { error?: string; needsCode?: boolean; needsPassword?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; needsCode?: boolean; needsPassword?: boolean } | null> {
  const { userId, workspaceId } = await requireWorkspace();

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
    // Pull the row we just authenticated so we can mirror the username/chat
    // into channel_profiles. Telegram doesn't expose an avatar via our bot
    // credentials path, so we leave that null — the UI falls back to the
    // Telegram mark.
    const [tgRow] = await db
      .select({ chatId: telegramCredentials.chatId, username: telegramCredentials.username })
      .from(telegramCredentials)
      .where(eq(telegramCredentials.workspaceId, workspaceId))
      .limit(1);
    if (tgRow) {
      const handle = tgRow.username ? `@${tgRow.username}` : null;
      await upsertChannelProfile(userId, "telegram", {
        providerAccountId: tgRow.chatId,
        displayName: tgRow.username ?? tgRow.chatId,
        handle,
        profileUrl: tgRow.username ? `https://t.me/${tgRow.username}` : null,
      });
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

  const [tgRow] = await db
    .select({ chatId: telegramCredentials.chatId, username: telegramCredentials.username })
    .from(telegramCredentials)
    .where(eq(telegramCredentials.workspaceId, workspaceId))
    .limit(1);
  if (tgRow) {
    const handle = tgRow.username ? `@${tgRow.username}` : null;
    await upsertChannelProfile(userId, "telegram", {
      providerAccountId: tgRow.chatId,
      displayName: tgRow.username ?? tgRow.chatId,
      handle,
      profileUrl: tgRow.username ? `https://t.me/${tgRow.username}` : null,
    });
  }

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
  redirect("/app/settings/channels?connected=telegram");
}

export async function disconnectTelegram() {
  const { userId, workspaceId } = await requireWorkspace();

  await db
    .delete(telegramCredentials)
    .where(eq(telegramCredentials.workspaceId, workspaceId));
  await db
    .delete(channelProfiles)
    .where(
      and(
        eq(channelProfiles.workspaceId, workspaceId),
        eq(channelProfiles.channel, "telegram"),
      ),
    );

  revalidatePath("/app/settings/channels");
  revalidatePath("/app/dashboard");
}

// Channel state machine (§8). Lets a user pick how a gated platform behaves —
// silent queue (`review_pending`) vs. reminder-me mode (`manual_assist`) —
// or leave it on `auto` which defers to the platform's current gating status.
export async function updateChannelPublishMode(formData: FormData) {
  const { userId, workspaceId } = await requireWorkspace();
  const channel = String(formData.get("channel") ?? "");
  const mode = formData.get("mode");

  if (!channel) throw new Error("channel is required");
  if (!isPublishMode(mode)) throw new Error("invalid publish mode");

  await setChannelPublishMode(userId, channel, mode);
  revalidatePath("/app/settings/channels");
}

export async function updateNotificationPreferences(formData: FormData) {
  const { userId, workspaceId } = await requireWorkspace();

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
  const { userId, workspaceId } = await requireWorkspace();
  const provider = String(formData.get("provider") ?? "");
  if (!provider) throw new Error("provider is required");

  const inserted = await db
    .insert(channelNotifications)
    .values({ userId, workspaceId, channel: provider })
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

    // Redirect with a query param to trigger a toast confirmation
    redirect(`/app/settings/channels?notify=1&channel=${provider}`);
  }

  revalidatePath("/app/settings/channels");
}
