import Link from "next/link";
import { and, eq, notInArray } from "drizzle-orm";
import { ArrowUpRight, Lock, Plus, ShieldCheck, Sparkle, Trash2 } from "lucide-react";
import { db } from "@/db";
import { accounts, blueskyCredentials } from "@/db/schema";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { getCurrentUser } from "@/lib/current-user";
import { getEntitlements } from "@/lib/billing/entitlements";
import { cn } from "@/lib/utils";
import { connectChannel, disconnectChannel } from "../actions";
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
} from "@/app/auth/_components/provider-icons";

export const dynamic = "force-dynamic";

type ProviderConfig = {
  id: string;
  name: string;
  purpose: string;
  Icon: React.ComponentType<{ className?: string }>;
  mono?: boolean;
  status: "available" | "soon";
};

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
    Icon: XIcon,
    mono: true,
    status: "available",
  },
  {
    id: "facebook",
    name: "Facebook",
    purpose: "Publish to your page.",
    Icon: FacebookIcon,
    mono: true,
    status: "available",
  },
  {
    id: "instagram",
    name: "Instagram",
    purpose: "Schedule feed posts and reels.",
    Icon: InstagramIcon,
    mono: true,
    status: "available",
  },
  {
    id: "tiktok",
    name: "TikTok",
    purpose: "Queue short-form video.",
    Icon: TikTokIcon,
    mono: true,
    status: "available",
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
    id: "threads",
    name: "Threads",
    purpose: "Text updates to the Threads network.",
    Icon: ThreadsIcon,
    mono: true,
    status: "soon",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    purpose: "Pins and idea pins.",
    Icon: PinterestIcon,
    mono: true,
    status: "soon",
  },
  {
    id: "youtube",
    name: "YouTube",
    purpose: "Shorts and community posts.",
    Icon: YouTubeIcon,
    mono: true,
    status: "soon",
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

  const [rows, blueskyRows] = await Promise.all([
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
  ]);

  const connected = new Set(rows.map((r) => r.provider));
  if (blueskyRows.length > 0) {
    connected.add("bluesky");
  }
  const needsReauth = new Set(
    rows.filter((r) => r.reauthRequired).map((r) => r.provider),
  );

  const entitlements = await getEntitlements(user.id, connected.size);
  const atLimit = entitlements.channelsRemaining <= 0;
  const params = await searchParams;
  const hitLimit = firstParam(params.limit) === "1";

  return (
    <div className="space-y-8">
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

      <ul className="rounded-3xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
        {[...PROVIDERS].sort((a, b) => {
          const ac = connected.has(a.id) ? 0 : 1;
          const bc = connected.has(b.id) ? 0 : 1;
          return ac - bc;
        }).map((p) => {
          const isConnected = connected.has(p.id);
          const isSoon = p.status === "soon";
          const isLocked = !isConnected && !isSoon && atLimit;
          const isReauth = isConnected && needsReauth.has(p.id);
          return (
            <li
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4"
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
                ) : isConnected ? (
                  <div className="flex items-center gap-1.5">
                    {p.id === "bluesky" ? (
                      <Link
                        href="/app/settings/channels/bluesky-connect"
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors"
                      >
                        Reconnect
                      </Link>
                    ) : isReauth ? (
                      <form action={connectChannel}>
                        <input type="hidden" name="provider" value={p.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors"
                        >
                          Reconnect
                        </button>
                      </form>
                    ) : null}
                    <form action={disconnectChannel}>
                      <input type="hidden" name="provider" value={p.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Disconnect
                      </button>
                    </form>
                  </div>
                ) : isLocked ? (
                  <Link
                    href="/app/settings/billing"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] text-ink/65 hover:text-ink hover:border-ink transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Upgrade to connect
                  </Link>
                ) : p.id === "bluesky" ? (
                  <Link
                    href="/app/settings/channels/bluesky-connect"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Connect
                  </Link>
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

      <div className="rounded-2xl border border-dashed border-border-strong p-5 flex items-start gap-4">
        <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-ink" />
        </span>
        <div>
          <p className="text-[13.5px] text-ink font-medium">
            We keep this list tight on purpose.
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60 leading-[1.55] max-w-2xl">
            Aloha requests the narrowest OAuth scopes each network allows —
            enough to read and write your own posts, nothing broader. You can
            also revoke access directly in your account settings on each
            provider, and we&apos;ll fail gracefully the next time we try.
          </p>
        </div>
      </div>
    </div>
  );
}
