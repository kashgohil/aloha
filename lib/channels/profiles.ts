// Per-channel profile fetchers. Called from the connect paths (OAuth signIn
// event, manual connect actions) so the UI can surface avatar + handle +
// follower count wherever a connected channel is listed. Best-effort: a
// failed fetch is logged and swallowed so it never blocks a connection.

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  blueskyCredentials,
  channelProfiles,
  mastodonCredentials,
  telegramCredentials,
  users,
} from "@/db/schema";
import { AtpAgent } from "@atproto/api";
import { getFreshToken } from "@/lib/publishers/tokens";

export type ChannelProfileInput = {
  providerAccountId?: string | null;
  displayName?: string | null;
  handle?: string | null;
  avatarUrl?: string | null;
  profileUrl?: string | null;
  bio?: string | null;
  followerCount?: number | null;
};

async function resolveWorkspaceId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ workspaceId: users.activeWorkspaceId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.workspaceId ?? null;
}

export async function upsertChannelProfile(
  userId: string,
  channel: string,
  input: ChannelProfileInput,
) {
  const now = new Date();
  const workspaceId = await resolveWorkspaceId(userId);
  // Profile fetch is best-effort — if the user has no workspace yet (can
  // happen mid-OAuth, before onboarding completes), skip rather than
  // block the connection. Next profile refresh will retry.
  if (!workspaceId) return;
  await db
    .insert(channelProfiles)
    .values({
      workspaceId,
      channel,
      providerAccountId: input.providerAccountId ?? null,
      displayName: input.displayName ?? null,
      handle: input.handle ?? null,
      avatarUrl: input.avatarUrl ?? null,
      profileUrl: input.profileUrl ?? null,
      bio: input.bio ?? null,
      followerCount: input.followerCount ?? null,
      fetchedAt: now,
    })
    .onConflictDoUpdate({
      target: [channelProfiles.workspaceId, channelProfiles.channel],
      set: {
        providerAccountId: input.providerAccountId ?? null,
        displayName: input.displayName ?? null,
        handle: input.handle ?? null,
        avatarUrl: input.avatarUrl ?? null,
        profileUrl: input.profileUrl ?? null,
        bio: input.bio ?? null,
        followerCount: input.followerCount ?? null,
        fetchedAt: now,
        updatedAt: now,
      },
    });
}

async function loadAccessToken(
  workspaceId: string,
  provider: string,
): Promise<{ accessToken: string; providerAccountId: string } | null> {
  const [row] = await db
    .select({
      accessToken: accounts.access_token,
      providerAccountId: accounts.providerAccountId,
    })
    .from(accounts)
    .where(and(eq(accounts.workspaceId, workspaceId), eq(accounts.provider, provider)))
    .limit(1);
  if (!row?.accessToken) return null;
  return {
    accessToken: row.accessToken,
    providerAccountId: row.providerAccountId,
  };
}

async function fetchTwitterProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch(
    "https://api.x.com/2/users/me?user.fields=profile_image_url,username,name,description,public_metrics,verified",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: {
      id: string;
      username: string;
      name: string;
      description?: string;
      profile_image_url?: string;
      public_metrics?: { followers_count?: number };
    };
  };
  const d = json.data;
  if (!d) return null;
  return {
    providerAccountId: d.id,
    displayName: d.name,
    handle: d.username,
    avatarUrl: d.profile_image_url?.replace("_normal", "_400x400") ?? null,
    profileUrl: `https://x.com/${d.username}`,
    bio: d.description ?? null,
    followerCount: d.public_metrics?.followers_count ?? null,
  };
}

async function fetchLinkedInProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    sub: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    email?: string;
  };
  return {
    providerAccountId: json.sub,
    displayName:
      json.name ??
      ([json.given_name, json.family_name].filter(Boolean).join(" ") || null),
    handle: null,
    avatarUrl: json.picture ?? null,
    profileUrl: null,
    bio: null,
    followerCount: null,
  };
}

async function fetchFacebookProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch(
    `https://graph.facebook.com/v22.0/me?fields=id,name,picture.width(400).height(400),link&access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    id: string;
    name: string;
    link?: string;
    picture?: { data?: { url?: string } };
  };
  return {
    providerAccountId: json.id,
    displayName: json.name,
    handle: null,
    avatarUrl: json.picture?.data?.url ?? null,
    profileUrl: json.link ?? null,
    bio: null,
    followerCount: null,
  };
}

async function fetchInstagramProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch(
    `https://graph.instagram.com/v22.0/me?fields=user_id,username,name,profile_picture_url,biography,followers_count&access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    user_id?: string;
    id?: string;
    username: string;
    name?: string;
    profile_picture_url?: string;
    biography?: string;
    followers_count?: number;
  };
  return {
    providerAccountId: json.user_id ?? json.id ?? null,
    displayName: json.name ?? json.username,
    handle: json.username,
    avatarUrl: json.profile_picture_url ?? null,
    profileUrl: `https://instagram.com/${json.username}`,
    bio: json.biography ?? null,
    followerCount: json.followers_count ?? null,
  };
}

async function fetchThreadsProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    id: string;
    username: string;
    name?: string;
    threads_profile_picture_url?: string;
    threads_biography?: string;
  };
  return {
    providerAccountId: json.id,
    displayName: json.name ?? json.username,
    handle: json.username,
    avatarUrl: json.threads_profile_picture_url ?? null,
    profileUrl: `https://threads.net/@${json.username}`,
    bio: json.threads_biography ?? null,
  };
}

async function fetchRedditProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "aloha:channel-profile:v1",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    id: string;
    name: string;
    icon_img?: string;
    subreddit?: { public_description?: string; subscribers?: number };
  };
  return {
    providerAccountId: json.id,
    displayName: json.name,
    handle: json.name,
    avatarUrl: json.icon_img?.split("?")[0] ?? null,
    profileUrl: `https://reddit.com/user/${json.name}`,
    bio: json.subreddit?.public_description ?? null,
    followerCount: json.subreddit?.subscribers ?? null,
  };
}

async function fetchPinterestProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    username: string;
    profile_image?: string;
    about?: string;
    account_type?: string;
    follower_count?: number;
  };
  return {
    providerAccountId: null,
    displayName: json.username,
    handle: json.username,
    avatarUrl: json.profile_image ?? null,
    profileUrl: `https://pinterest.com/${json.username}`,
    bio: json.about ?? null,
    followerCount: json.follower_count ?? null,
  };
}

async function fetchYouTubeProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    items?: Array<{
      id: string;
      snippet: {
        title: string;
        description?: string;
        customUrl?: string;
        thumbnails?: { default?: { url?: string }; high?: { url?: string } };
      };
      statistics?: { subscriberCount?: string };
    }>;
  };
  const c = json.items?.[0];
  if (!c) return null;
  const handle = c.snippet.customUrl ?? null;
  return {
    providerAccountId: c.id,
    displayName: c.snippet.title,
    handle,
    avatarUrl:
      c.snippet.thumbnails?.high?.url ??
      c.snippet.thumbnails?.default?.url ??
      null,
    profileUrl: handle
      ? `https://youtube.com/${handle}`
      : `https://youtube.com/channel/${c.id}`,
    bio: c.snippet.description ?? null,
    followerCount: c.statistics?.subscriberCount
      ? Number(c.statistics.subscriberCount)
      : null,
  };
}

async function fetchMediumProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch("https://api.medium.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: {
      id: string;
      username: string;
      name: string;
      url?: string;
      imageUrl?: string;
    };
  };
  const d = json.data;
  if (!d) return null;
  return {
    providerAccountId: d.id,
    displayName: d.name,
    handle: d.username,
    avatarUrl: d.imageUrl ?? null,
    profileUrl: d.url ?? `https://medium.com/@${d.username}`,
  };
}

async function fetchTikTokProfile(
  accessToken: string,
): Promise<ChannelProfileInput | null> {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,follower_count,username",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: {
      user?: {
        open_id?: string;
        display_name?: string;
        username?: string;
        avatar_url?: string;
        bio_description?: string;
        profile_deep_link?: string;
        follower_count?: number;
      };
    };
  };
  const u = json.data?.user;
  if (!u) return null;
  return {
    providerAccountId: u.open_id ?? null,
    displayName: u.display_name ?? null,
    handle: u.username ?? null,
    avatarUrl: u.avatar_url ?? null,
    profileUrl: u.profile_deep_link ?? null,
    bio: u.bio_description ?? null,
    followerCount: u.follower_count ?? null,
  };
}

// Dispatcher for OAuth channels. Loads the access token from the accounts
// table and calls the matching fetcher. Returns false if the channel isn't
// OAuth-backed (bluesky/mastodon/telegram handle their own flow in the
// connect action itself). Errors are swallowed — a failed profile fetch
// should never block connection.
// Providers whose refresh flow is wired into getFreshToken. Everything else
// falls back to the raw stored access_token (which may be expired — the
// fetch will just return null and we skip the upsert).
const REFRESHABLE = new Set([
  "linkedin",
  "twitter",
  "medium",
  "facebook",
  "instagram",
  "threads",
  "reddit",
  "pinterest",
  "youtube",
]);

export async function refreshOAuthChannelProfile(
  userId: string,
  provider: string,
): Promise<boolean> {
  try {
    const workspaceId = await resolveWorkspaceId(userId);
    if (!workspaceId) return false;
    const stored = await loadAccessToken(workspaceId, provider);
    if (!stored) return false;
    let accessToken = stored.accessToken;
    let providerAccountId = stored.providerAccountId;
    if (REFRESHABLE.has(provider)) {
      try {
        const fresh = await getFreshToken(
          workspaceId,
          provider as Parameters<typeof getFreshToken>[1],
        );
        accessToken = fresh.accessToken;
        providerAccountId = fresh.providerAccountId;
      } catch {
        // Token refresh failed (needs_reauth). Fall back to raw stored
        // token — the fetch will likely fail, which is fine.
      }
    }
    let profile: ChannelProfileInput | null = null;
    switch (provider) {
      case "twitter":
        profile = await fetchTwitterProfile(accessToken);
        break;
      case "linkedin":
        profile = await fetchLinkedInProfile(accessToken);
        break;
      case "facebook":
        profile = await fetchFacebookProfile(accessToken);
        break;
      case "instagram":
        profile = await fetchInstagramProfile(accessToken);
        break;
      case "threads":
        profile = await fetchThreadsProfile(accessToken);
        break;
      case "reddit":
        profile = await fetchRedditProfile(accessToken);
        break;
      case "pinterest":
        profile = await fetchPinterestProfile(accessToken);
        break;
      case "youtube":
        profile = await fetchYouTubeProfile(accessToken);
        break;
      case "medium":
        profile = await fetchMediumProfile(accessToken);
        break;
      case "tiktok":
        profile = await fetchTikTokProfile(accessToken);
        break;
      default:
        return false;
    }
    if (!profile) {
      // Still record the providerAccountId so the row exists — the UI can
      // then show "Connected" without avatar/handle.
      await upsertChannelProfile(userId, provider, { providerAccountId });
      return false;
    }
    await upsertChannelProfile(userId, provider, {
      providerAccountId: profile.providerAccountId ?? providerAccountId,
      ...profile,
    });
    return true;
  } catch (err) {
    console.error(`[channel-profile] ${provider} fetch failed`, err);
    return false;
  }
}

async function refreshBlueskyProfile(userId: string): Promise<boolean> {
  try {
    const workspaceId = await resolveWorkspaceId(userId);
    if (!workspaceId) return false;
    const [row] = await db
      .select({
        handle: blueskyCredentials.handle,
        appPassword: blueskyCredentials.appPassword,
        did: blueskyCredentials.did,
      })
      .from(blueskyCredentials)
      .where(eq(blueskyCredentials.workspaceId, workspaceId))
      .limit(1);
    if (!row) return false;
    const agent = new AtpAgent({ service: "https://bsky.social" });
    await agent.login({ identifier: row.handle, password: row.appPassword });
    const res = await agent.getProfile({ actor: row.handle });
    await upsertChannelProfile(userId, "bluesky", {
      providerAccountId: row.did ?? agent.session?.did ?? null,
      displayName: res.data.displayName ?? row.handle,
      handle: row.handle,
      avatarUrl: res.data.avatar ?? null,
      profileUrl: `https://bsky.app/profile/${row.handle}`,
      bio: res.data.description ?? null,
      followerCount: res.data.followersCount ?? null,
    });
    return true;
  } catch (err) {
    console.error("[channel-profile] bluesky fetch failed", err);
    return false;
  }
}

async function refreshMastodonProfile(userId: string): Promise<boolean> {
  try {
    const workspaceId = await resolveWorkspaceId(userId);
    if (!workspaceId) return false;
    const [row] = await db
      .select({
        instanceUrl: mastodonCredentials.instanceUrl,
        accessToken: mastodonCredentials.accessToken,
      })
      .from(mastodonCredentials)
      .where(eq(mastodonCredentials.workspaceId, workspaceId))
      .limit(1);
    if (!row) return false;
    const res = await fetch(
      `${row.instanceUrl}/api/v1/accounts/verify_credentials`,
      { headers: { Authorization: `Bearer ${row.accessToken}` } },
    );
    if (!res.ok) return false;
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
    const instanceHost = row.instanceUrl.replace(/^https?:\/\//, "");
    await upsertChannelProfile(userId, "mastodon", {
      providerAccountId: data.id,
      displayName: data.display_name || data.username,
      handle: `@${data.username}@${instanceHost}`,
      avatarUrl: data.avatar ?? data.avatar_static ?? null,
      profileUrl: data.url ?? `${row.instanceUrl}/@${data.username}`,
      bio: data.note ?? null,
      followerCount: data.followers_count ?? null,
    });
    return true;
  } catch (err) {
    console.error("[channel-profile] mastodon fetch failed", err);
    return false;
  }
}

async function refreshTelegramProfile(userId: string): Promise<boolean> {
  try {
    const workspaceId = await resolveWorkspaceId(userId);
    if (!workspaceId) return false;
    const [row] = await db
      .select({
        chatId: telegramCredentials.chatId,
        username: telegramCredentials.username,
      })
      .from(telegramCredentials)
      .where(eq(telegramCredentials.workspaceId, workspaceId))
      .limit(1);
    if (!row) return false;
    const handle = row.username ? `@${row.username}` : null;
    await upsertChannelProfile(userId, "telegram", {
      providerAccountId: row.chatId,
      displayName: row.username ?? row.chatId,
      handle,
      profileUrl: row.username ? `https://t.me/${row.username}` : null,
    });
    return true;
  } catch (err) {
    console.error("[channel-profile] telegram fetch failed", err);
    return false;
  }
}

// Unified refresh entry point. Dispatches to the right fetcher based on
// channel type. Safe to call on any connected channel — returns false
// silently if the channel isn't connected or the refresh fails.
export async function refreshChannelProfile(
  userId: string,
  channel: string,
): Promise<boolean> {
  if (channel === "bluesky") return refreshBlueskyProfile(userId);
  if (channel === "mastodon") return refreshMastodonProfile(userId);
  if (channel === "telegram") return refreshTelegramProfile(userId);
  return refreshOAuthChannelProfile(userId, channel);
}
