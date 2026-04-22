import Link from "next/link";
import { and, eq, notInArray } from "drizzle-orm";
import { ArrowUpRight, Bell, BookOpen, Clock, Lock, Plus, ShieldCheck, Sparkle } from "lucide-react";
import { db } from "@/db";
import {
  accounts,
  blueskyCredentials,
  channelNotifications,
  channelProfiles,
  channelStates,
  mastodonCredentials,
  telegramCredentials,
} from "@/db/schema";
import type { ChannelProfileView } from "@/components/channel-identity";
import { MastodonListItem } from "./_components/mastodon-list-item";
import { BlueskyListItem } from "./_components/bluesky-list-item";
import { TelegramListItem } from "./_components/telegram-list-item";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { isProviderConfigured } from "@/lib/configured-providers";
import {
  PLATFORM_GATING,
  resolveEffectiveState,
  type EffectiveState,
  type PublishMode,
} from "@/lib/channel-state";
import { getCurrentUser } from "@/lib/current-user";
import { getEntitlements } from "@/lib/billing/entitlements";
import { cn } from "@/lib/utils";
import { connectChannel, refreshChannelProfileAction, updateChannelPublishMode, notifyWhenAvailable } from "../actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit";
import { FlashToast } from "@/components/ui/flash-toast";
import { ConnectedAccountCard } from "@/components/connected-account-card";
import { DisconnectChannelButton } from "./_components/disconnect-confirm";
import { RefreshChannelButton } from "./_components/refresh-channel-button";
import {
  LinkedInIcon,
  XIcon,
  BlueskyIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  ThreadsIcon,
  PinterestIcon,
  YouTubeIcon,
  MediumIcon,
  MastodonIcon,
  RedditIcon,
  TelegramIcon,
} from "@/app/auth/_components/provider-icons";

export const dynamic = "force-dynamic";

type ProviderConfig = {
  id: string;
  name: string;
  purpose: string;
  // Optional secondary line rendered under `purpose` — used for caveats
  // that don't belong in the one-liner (DM scope requirements, etc).
  note?: string;
  Icon: React.ComponentType<{ className?: string }>;
  mono?: boolean;
  status: "available" | "approval_needed" | "soon";
};

// Platform availability:
// - "available": Can connect and auto-publish
// - "approval_needed": Can include in AI generation/campaigns, but cannot connect for auto-publish
// - "soon": Coming soon
const PROVIDERS: ProviderConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    purpose: "Publish to your profile.",
    Icon: LinkedInIcon,
    mono: true,
    status: "available",
  },
  {
    id: "twitter",
    name: "X",
    purpose: "Publish posts and threads.",
    note: "DMs require the dm.read / dm.write scopes — if you connected before DMs shipped, reconnect to pick them up.",
    Icon: XIcon,
    mono: true,
    status: "available",
  },
  {
    id: "facebook",
    name: "Facebook",
    purpose: "Generate content for campaigns. Auto-publish coming after platform approval.",
    Icon: FacebookIcon,
    mono: true,
    status: "approval_needed",
  },
  {
    id: "instagram",
    name: "Instagram",
    purpose: "Generate content for campaigns. Auto-publish coming after platform approval.",
    Icon: InstagramIcon,
    mono: true,
    status: "approval_needed",
  },
  {
    id: "tiktok",
    name: "TikTok",
    purpose: "Generate content for campaigns. Auto-publish coming after platform approval.",
    Icon: TikTokIcon,
    mono: true,
    status: "approval_needed",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    purpose: "Posts, threads, and images.",
    Icon: BlueskyIcon,
    mono: true,
    status: "available",
  },
  {
    id: "mastodon",
    name: "Mastodon",
    purpose: "Federated posts to any instance.",
    Icon: MastodonIcon,
    mono: true,
    status: "available",
  },
  {
    id: "medium",
    name: "Medium",
    purpose: "Generate articles. Auto-publish coming after platform approval.",
    Icon: MediumIcon,
    mono: true,
    status: "approval_needed",
  },
  {
    id: "threads",
    name: "Threads",
    purpose: "Generate content for campaigns. Auto-publish coming after platform approval.",
    Icon: ThreadsIcon,
    mono: true,
    status: "approval_needed",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    purpose: "Generate pin ideas. Auto-publish coming after platform approval.",
    Icon: PinterestIcon,
    mono: true,
    status: "approval_needed",
  },
  {
    id: "youtube",
    name: "YouTube",
    purpose: "Generate content for campaigns. Auto-publish coming after platform approval.",
    Icon: YouTubeIcon,
    mono: true,
    status: "approval_needed",
  },
  {
    id: "reddit",
    name: "Reddit",
    purpose: "Generate post ideas. Auto-publish coming after platform approval.",
    Icon: RedditIcon,
    mono: true,
    status: "approval_needed",
  },
  {
    id: "telegram",
    name: "Telegram",
    purpose: "Broadcast messages and photos to your channel.",
    Icon: TelegramIcon,
    mono: true,
    status: "available",
  },
];

function ReauthBanner({ providers }: { providers: string[] }) {
  const providerLabel = (id: string) => {
    const p = PROVIDERS.find((x) => x.id === id);
    return p?.name ?? id;
  };
  return (
    <div
      role="alert"
      className="rounded-2xl border border-primary/40 bg-primary-soft/60 px-5 py-4 flex flex-wrap items-start gap-4"
    >
      <span className="mt-[2px] w-9 h-9 rounded-full bg-background border border-primary/40 grid place-items-center shrink-0">
        <ShieldCheck className="w-4 h-4 text-primary-deep" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] text-ink font-medium">
          {providers.length === 1
            ? `${providerLabel(providers[0])} needs to be reconnected.`
            : "Some channels need to be reconnected."}
        </p>
        <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
          {providers.length === 1
            ? "Your stored token couldn't be refreshed — this usually means you changed your password, revoked access, or the provider rotated its keys. Reconnect below and scheduling will resume."
            : `Reconnect ${providers
                .map(providerLabel)
                .join(", ")} below to resume scheduling on those channels.`}
        </p>
      </div>
    </div>
  );
}

function FreeTierBanner({
  connected,
  limit,
  nudge,
}: {
  connected: number;
  limit: number;
  nudge: boolean;
}) {
  const atLimit = connected >= limit;
  const tone = atLimit || nudge ? "primary" : "muted";
  return (
    <div
      role={nudge ? "alert" : undefined}
      className={cn(
        "rounded-2xl border px-5 py-4 flex flex-wrap items-start gap-4",
        tone === "primary"
          ? "border-peach-300 bg-peach-100"
          : "border-border-strong bg-background-elev",
      )}
    >
      <span
        className={cn(
          "mt-[2px] w-9 h-9 rounded-full border grid place-items-center shrink-0",
          tone === "primary"
            ? "bg-background border-peach-300"
            : "bg-background border-border-strong",
        )}
      >
        <Sparkle className="w-4 h-4 text-primary" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] text-ink font-medium">
          {nudge
            ? "Upgrade to add more channels."
            : atLimit
              ? "You're using all of your free channels."
              : "Free tier — scheduling + AI companion."}
        </p>
        <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
          {atLimit
            ? `You've connected ${connected} of ${limit} channels included on free. Upgrade to Basic to connect as many as you need — pricing scales per channel with volume discounts.`
            : `${connected} of ${limit} channels connected. Room for ${limit - connected} more on free, then Basic unlocks unlimited with per-channel pricing.`}
        </p>
      </div>
      <Link
        href="/app/settings/billing"
        className={cn(
          "inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-medium transition-colors",
          tone === "primary"
            ? "bg-ink text-background hover:bg-primary"
            : "text-ink/65 hover:text-ink hover:bg-peach-100/60",
        )}
      >
        See plans
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const firstParam = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function ChannelsSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;

  const [rows, blueskyRows, mastodonRows, telegramRows, stateRows, notifyRows, profileRows] = await Promise.all([
    db
      .select({
        provider: accounts.provider,
        reauthRequired: accounts.reauthRequired,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, user.id),
          notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
        ),
      ),
    db
      .select({ id: blueskyCredentials.id })
      .from(blueskyCredentials)
      .where(eq(blueskyCredentials.userId, user.id))
      .limit(1),
    db
      .select({ id: mastodonCredentials.id })
      .from(mastodonCredentials)
      .where(eq(mastodonCredentials.userId, user.id))
      .limit(1),
    db
      .select({ id: telegramCredentials.id, reauthRequired: telegramCredentials.reauthRequired })
      .from(telegramCredentials)
      .where(eq(telegramCredentials.userId, user.id))
      .limit(1),
    db
      .select({
        channel: channelStates.channel,
        publishMode: channelStates.publishMode,
        reviewStartedAt: channelStates.reviewStartedAt,
        notes: channelStates.notes,
      })
      .from(channelStates)
      .where(eq(channelStates.userId, user.id)),
    db
      .select({ channel: channelNotifications.channel })
      .from(channelNotifications)
      .where(eq(channelNotifications.userId, user.id)),
    db
      .select({
        channel: channelProfiles.channel,
        displayName: channelProfiles.displayName,
        handle: channelProfiles.handle,
        avatarUrl: channelProfiles.avatarUrl,
        profileUrl: channelProfiles.profileUrl,
        followerCount: channelProfiles.followerCount,
      })
      .from(channelProfiles)
      .where(eq(channelProfiles.userId, user.id)),
  ]);
  const notifiedChannels = new Set(notifyRows.map((r) => r.channel));
  const profileByChannel = new Map<string, ChannelProfileView>(
    profileRows.map((p) => [p.channel, p as ChannelProfileView]),
  );

  const connected = new Set(rows.map((r) => r.provider));
  if (blueskyRows.length > 0) {
    connected.add("bluesky");
  }
  const mastodonRow = mastodonRows[0];
  if (mastodonRow) {
    connected.add("mastodon");
  }
  const telegramRow = telegramRows[0];
  if (telegramRow) {
    connected.add("telegram");
  }
  const needsReauth = new Set(
    rows.filter((r) => r.reauthRequired).map((r) => r.provider),
  );
  // Check custom credentials tables for reauth flags
  if (telegramRow?.reauthRequired) {
    needsReauth.add("telegram");
  }

  const stateByChannel = new Map(stateRows.map((r) => [r.channel, r]));
  const gatedConnected = PROVIDERS.filter(
    (p) =>
      p.status === "available" &&
      connected.has(p.id) &&
      PLATFORM_GATING[p.id] === "pending_approval",
  ).map((p) => {
    const override = stateByChannel.get(p.id) ?? {
      publishMode: "auto" as PublishMode,
      reviewStartedAt: null,
      notes: null,
    };
    const effective = resolveEffectiveState(p.id, true, override);
    return { provider: p, override, effective };
  });

  const entitlements = await getEntitlements(user.id, connected.size);
  const atLimit = entitlements.channelsRemaining <= 0;
  const params = await searchParams;
  const hitLimit = firstParam(params.limit) === "1";

  return (
    <div className="space-y-8">
      <FlashToast
        entries={[
          {
            param: "notify",
            value: "1",
            type: "success",
            message: "You're on the list! We'll let you know when this channel becomes available.",
          },
        ]}
      />
      <div>
        <h2 className="font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          Connected accounts
        </h2>
        <p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
          Each channel you connect unlocks scheduling, publishing, and
          analytics for that network. You can disconnect any of them from
          here — we&apos;ll stop posting immediately, and the historical data
          stays put.
        </p>
      </div>

      {needsReauth.size > 0 ? (
        <ReauthBanner providers={Array.from(needsReauth)} />
      ) : null}

      {entitlements.plan === "free" ? (
        <FreeTierBanner
          connected={connected.size}
          limit={entitlements.channelLimit}
          nudge={hitLimit}
        />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
      <div className="space-y-8 min-w-0">
      <ul className="rounded-3xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
        {[...PROVIDERS].sort((a, b) => {
          // Priority groups: 0 connected, 1 available+configured, 2 approval_needed (notify me),
          // 3 unconfigured available, 4 soon. Keeps notify-me channels together.
          const rank = (p: ProviderConfig) => {
            if (connected.has(p.id)) return 0;
            if (p.status === "soon") return 4;
            if (p.status === "approval_needed") return 2;
            if (!isProviderConfigured(p.id)) return 3;
            return 1;
          };
          return rank(a) - rank(b);
        }).map((p) => {
          if (p.id === "mastodon") {
            const isConnectedMastodon = connected.has("mastodon");
            const isSoon = p.status === "soon";
            const isApprovalNeeded = p.status === "approval_needed";
            return (
              <MastodonListItem
                key={p.id}
                isConnected={isConnectedMastodon}
                isSoon={isSoon}
                isApprovalNeeded={isApprovalNeeded}
                atLimit={atLimit && entitlements.plan === "free"}
                profile={profileByChannel.get("mastodon") ?? null}
              />
            );
          }

          if (p.id === "bluesky" && p.status === "available") {
            return (
              <BlueskyListItem
                key={p.id}
                isConnected={connected.has("bluesky")}
                needsReauth={needsReauth.has("bluesky")}
                atLimit={atLimit && entitlements.plan === "free"}
                profile={profileByChannel.get("bluesky") ?? null}
              />
            );
          }

          if (p.id === "telegram" && p.status === "available") {
            return (
              <TelegramListItem
                key={p.id}
                isConnected={connected.has("telegram")}
                needsReauth={needsReauth.has("telegram")}
                atLimit={atLimit && entitlements.plan === "free"}
                profile={profileByChannel.get("telegram") ?? null}
              />
            );
          }

          const isConnected = connected.has(p.id);
          const isSoon = p.status === "soon";
          const isApprovalNeeded = p.status === "approval_needed";
          const isUnconfigured = !isConnected && !isSoon && !isProviderConfigured(p.id);
          const isLocked = !isConnected && !isSoon && !isApprovalNeeded && !isUnconfigured && atLimit && entitlements.plan === "free";
          const isReauth = isConnected && needsReauth.has(p.id);
          const profile = isConnected ? profileByChannel.get(p.id) ?? null : null;
          return (
            <li
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-4"
            >
              <span
                className={cn(
                  "w-11 h-11 rounded-full border grid place-items-center shrink-0",
                  isReauth
                    ? "bg-primary-soft border-primary/40"
                    : isConnected
                      ? "bg-peach-100 border-peach-300"
                      : "bg-background border-border",
                  p.mono && "text-ink",
                )}
              >
                <p.Icon className="w-[18px] h-[18px]" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] text-ink font-medium">{p.name}</p>
                  {isConnected && !isReauth ? (
                    <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] font-medium tracking-wide">
                      <ShieldCheck className="w-3 h-3" />
                      Connected
                    </span>
                  ) : null}
                  {isReauth ? (
                    <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-primary-soft text-primary-deep text-[10.5px] font-medium tracking-wide">
                      Reconnect needed
                    </span>
                  ) : null}
                  {!isSoon ? (
                    <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10.5px] text-ink font-medium tracking-wide">
                      <Sparkle className="w-3 h-3" />
                      Muse
                    </span>
                  ) : null}
                  {isSoon ? (
                    <span className="inline-flex items-center h-5 px-2 rounded-full border border-dashed border-border-strong text-[10.5px] text-ink/55 tracking-wide uppercase">
                      Soon
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[12.5px] text-ink/60">
                  {isReauth
                    ? "Your token expired or was revoked. Reconnect to resume publishing."
                    : p.purpose}
                </p>
                {!isReauth && p.note ? (
                  <p className="mt-1 text-[11.5px] text-ink/50 leading-[1.5]">
                    {p.note}
                  </p>
                ) : null}
                {profile && (profile.handle || profile.displayName || profile.avatarUrl) ? (
                  <div className="mt-3">
                    <ConnectedAccountCard
                      profile={{ ...profile, channel: p.id }}
                      channel={p.id}
                    />
                  </div>
                ) : null}
              </div>

              <div className="shrink-0">
                {isSoon ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-dashed border-border-strong text-[13px] text-ink/45"
                  >
                    Not available yet
                  </button>
                ) : isApprovalNeeded ? (
                  notifiedChannels.has(p.id) ? (
                    <span className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-peach-300 bg-peach-100/60 text-[13px] text-ink/70">
                      <Bell className="w-3.5 h-3.5" />
                      You&apos;re on the list
                    </span>
                  ) : (
                    <form action={notifyWhenAvailable}>
                      <input type="hidden" name="provider" value={p.id} />
                      <PendingSubmitButton
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-peach-300 bg-peach-100 text-[13px] text-ink font-medium hover:bg-peach-200 transition-colors"
                        pendingLabel="Saving…"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Notify me
                      </PendingSubmitButton>
                    </form>
                  )
                ) : isUnconfigured ? (
                  <button
                    type="button"
                    disabled
                    title="We're finishing setup on this one — it'll be ready to connect soon."
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-dashed border-border-strong text-[13px] text-ink/45"
                  >
                    Getting ready
                  </button>
                ) : isConnected ? (
                    <div className="flex items-center gap-1.5">
                    {isReauth ? (
                      <form action={connectChannel}>
                        <input type="hidden" name="provider" value={p.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors"
                        >
                          Reconnect
                        </button>
                      </form>
                    ) : (
                      <RefreshChannelButton
                        provider={p.id}
                        channelName={p.name}
                      />
                    )}
                    <DisconnectChannelButton provider={p.id} />
                  </div>
                ) : isLocked ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] text-ink/40 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Connect
                  </button>
                ) : (
                  <form action={connectChannel}>
                    <input type="hidden" name="provider" value={p.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Connect
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {atLimit && entitlements.plan === "free" ? (
        <p className="text-[12.5px] text-ink/60 leading-[1.55] px-1">
          Want more channels?{" "}
          <a
            href="mailto:hello@usealoha.app?subject=More%20channels%20on%20Aloha"
            className="text-ink font-medium underline underline-offset-4 decoration-dashed hover:decoration-solid"
          >
            Contact us
          </a>
          .
        </p>
      ) : null}

      {gatedConnected.length > 0 ? (
        <ChannelStatusPanel items={gatedConnected} />
      ) : null}
      </div>

      <aside className="lg:sticky lg:top-6 space-y-4">
        <section className="rounded-3xl border border-dashed border-peach-300/70 bg-peach-100/40 p-5">
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-primary-deep">
            <ShieldCheck className="w-3 h-3" />
            Scopes
          </div>
          <p className="mt-2 text-[13px] text-ink font-medium leading-[1.4]">
            We keep this list tight on purpose.
          </p>
          <p className="mt-1.5 text-[12px] text-ink/65 leading-[1.55]">
            Aloha requests the narrowest OAuth scopes each network allows —
            enough to read and write your own posts, nothing broader. Revoke
            access directly in your account settings on each provider and
            we&apos;ll fail gracefully the next time we try.
          </p>
        </section>

        <Link
          href="/app/settings/muse"
          className="group block rounded-3xl border border-border bg-background-elev p-5 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink/60">
              <BookOpen className="w-3 h-3" />
              Knowledge sources
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink/40 group-hover:text-ink transition-colors shrink-0" />
          </div>
          <p className="mt-2 text-[13px] text-ink font-medium leading-[1.4]">
            Looking for Notion or Google Docs?
          </p>
          <p className="mt-1.5 text-[12px] text-ink/65 leading-[1.55]">
            Those feed Muse — your writing voice model — not the publishing
            pipeline. They live on the{" "}
            <span className="text-ink font-medium">Muse</span> tab.
          </p>
        </Link>
      </aside>
      </div>
    </div>
  );
}

type GatedItem = {
  provider: ProviderConfig;
  override: {
    publishMode: PublishMode;
    reviewStartedAt: Date | null;
    notes: string | null;
  };
  effective: EffectiveState;
};

function stateChip(effective: EffectiveState) {
  if (effective === "connected_review_pending") {
    return {
      label: "Awaiting approval",
      Icon: Clock,
      className: "bg-peach-100 text-ink border-peach-300",
    };
  }
  if (effective === "connected_manual_assist") {
    return {
      label: "Manual assist",
      Icon: Bell,
      className: "bg-primary-soft text-primary-deep border-primary/40",
    };
  }
  return {
    label: "Live",
    Icon: ShieldCheck,
    className: "bg-ink text-background border-ink",
  };
}

function modeCopy(effective: EffectiveState) {
  if (effective === "connected_manual_assist") {
    return "Scheduled posts stay drafted. At post time we'll ping you with the content pre-formatted to paste into the native app.";
  }
  return "Your scheduled posts will auto-publish here as soon as approval lands. Until then, we hold them without retrying.";
}

function ChannelStatusPanel({ items }: { items: GatedItem[] }) {
  return (
    <section className="rounded-3xl border border-border bg-background-elev overflow-hidden">
      <header className="px-5 py-4 border-b border-border flex items-start gap-3">
        <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
          <Clock className="w-4 h-4 text-ink" />
        </span>
        <div>
          <p className="text-[14.5px] text-ink font-medium">Channel status</p>
          <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
            Some platforms require an app review before third-party tools can
            publish. You can still draft, schedule, and generate — we just
            hold the actual post until approval lands, or ping you to
            publish it yourself.
          </p>
        </div>
      </header>
      <ul className="divide-y divide-border">
        {items.map(({ provider, override, effective }) => {
          const chip = stateChip(effective);
          return (
            <li
              key={provider.id}
              className="px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-start"
            >
              <span className="w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0 text-ink">
                <provider.Icon className="w-[16px] h-[16px]" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] text-ink font-medium">
                    {provider.name}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 h-5 px-2 rounded-full border text-[10.5px] font-medium tracking-wide",
                      chip.className,
                    )}
                  >
                    <chip.Icon className="w-3 h-3" />
                    {chip.label}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] text-ink/60 leading-[1.55] max-w-2xl">
                  {modeCopy(effective)}
                </p>
                <form
                  action={updateChannelPublishMode}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  <input type="hidden" name="channel" value={provider.id} />
                  {(
                    [
                      { mode: "auto", label: "Default" },
                      { mode: "review_pending", label: "Queue silently" },
                      { mode: "manual_assist", label: "Remind me" },
                    ] as const
                  ).map((opt) => {
                    const active = override.publishMode === opt.mode;
                    return (
                      <button
                        key={opt.mode}
                        type="submit"
                        name="mode"
                        value={opt.mode}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center h-8 px-3 rounded-full text-[12px] font-medium transition-colors",
                          active
                            ? "bg-ink text-background"
                            : "bg-background text-ink/70 border border-border hover:text-ink",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
