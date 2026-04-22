import Link from "next/link";
import { and, desc, eq, ne, notInArray, or, sql } from "drizzle-orm";
import {
  BookOpen,
  Check,
  Image as ImageIcon,
  Link2,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { db } from "@/db";
import {
  accounts,
  blueskyCredentials,
  brandCorpus,
  ideas,
  mastodonCredentials,
  notionCredentials,
  platformContentCache,
  posts,
  telegramCredentials,
} from "@/db/schema";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { trainVoiceAction } from "@/app/actions/voice";
import {
  syncNotionAction,
} from "@/app/actions/corpus";
import { requestMuseAccessAction } from "@/app/actions/muse-access";
import { loadAllChannelVoices, loadCurrentVoice } from "@/lib/ai/voice";
import { getCurrentUser } from "@/lib/current-user";
import { getMuseAccessState } from "@/lib/billing/muse";
import { FlashToast } from "@/components/ui/flash-toast";
import { PendingSubmitButton } from "@/components/ui/pending-submit";
import { Slider } from "./_components/slider";
import { SyncNotionButton } from "./_components/sync-button";
import { DisconnectNotionButton } from "./_components/disconnect-confirm";
import { GoogleIcon, NotionIcon } from "@/app/auth/_components/provider-icons";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CHANNEL_DELTA_MIN_SAMPLES = 15;

export default async function MuseSettingsPage() {
  const user = (await getCurrentUser())!;

  const access = await getMuseAccessState(user.id);
  if (!access.granted) {
    return <MuseRequestAccess requestedAt={access.requestedAt} />;
  }

  const [
    voice,
    notion,
    corpusRows,
    channelCounts,
    channelDeltas,
    internalPostStats,
    ideaCount,
    connectedChannels,
  ] = await Promise.all([
    loadCurrentVoice(user.id),
    db
      .select({
        workspaceId: notionCredentials.workspaceId,
        workspaceName: notionCredentials.workspaceName,
        workspaceIcon: notionCredentials.workspaceIcon,
        reauthRequired: notionCredentials.reauthRequired,
        lastSyncedAt: notionCredentials.lastSyncedAt,
      })
      .from(notionCredentials)
      .where(eq(notionCredentials.userId, user.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({
        source: brandCorpus.source,
        title: brandCorpus.title,
        fetchedAt: brandCorpus.fetchedAt,
      })
      .from(brandCorpus)
      .where(eq(brandCorpus.userId, user.id))
      .orderBy(desc(brandCorpus.fetchedAt)),
    db
      .select({
        platform: platformContentCache.platform,
        count: sql<number>`count(*)::int`,
      })
      .from(platformContentCache)
      .where(eq(platformContentCache.userId, user.id))
      .groupBy(platformContentCache.platform),
    loadAllChannelVoices(user.id),
    // Pull every non-deleted post's platforms and aggregate in JS — matches
    // the training-side filter exactly, and lets channel-tuning rows reflect
    // Aloha-composed drafts/scheduled/published posts.
    db
      .select({ platforms: posts.platforms })
      .from(posts)
      .where(and(eq(posts.userId, user.id), ne(posts.status, "deleted")))
      .then((rows) => {
        const perChannel = new Map<string, number>();
        for (const row of rows) {
          for (const platform of row.platforms) {
            perChannel.set(platform, (perChannel.get(platform) ?? 0) + 1);
          }
        }
        return {
          total: rows.length,
          perChannel: Array.from(perChannel, ([platform, count]) => ({
            platform,
            count,
          })),
        };
      }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ideas)
      .where(
        and(
          eq(ideas.userId, user.id),
          or(eq(ideas.source, "manual"), eq(ideas.source, "url_clip")),
        ),
      )
      .then((rows) => rows[0]?.count ?? 0),
    // Enumerate every connected channel — OAuth providers plus the per-provider
    // credential tables. A channel with zero posts still needs a row in the
    // tuning list so the user sees it counting up toward the threshold.
    Promise.all([
      db
        .select({ provider: accounts.provider })
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
        .select({ id: telegramCredentials.id })
        .from(telegramCredentials)
        .where(eq(telegramCredentials.userId, user.id))
        .limit(1),
    ]).then(([oauthRows, blueskyRows, mastodonRows, telegramRows]) =>
      Array.from(
        new Set<string>([
          ...oauthRows.map((r) => r.provider),
          ...(blueskyRows.length > 0 ? ["bluesky"] : []),
          ...(mastodonRows.length > 0 ? ["mastodon"] : []),
          ...(telegramRows.length > 0 ? ["telegram"] : []),
        ]),
      ),
    ),
  ]);

  // Combined per-channel sample counts (cached readback + internal Aloha
  // posts) so the "need N more" threshold reflects what training actually
  // sees. Connected channels are seeded at zero so newly-connected accounts
  // with no posts yet still appear in the tuning list.
  const mergedChannelCounts = (() => {
    const map = new Map<string, number>();
    for (const channel of connectedChannels) map.set(channel, 0);
    for (const c of channelCounts) {
      map.set(c.platform, (map.get(c.platform) ?? 0) + c.count);
    }
    for (const c of internalPostStats.perChannel) {
      map.set(c.platform, (map.get(c.platform) ?? 0) + c.count);
    }
    return Array.from(map, ([platform, count]) => ({ platform, count }));
  })();

  const currentTone = (voice?.tone ?? {}) as {
    summary?: string;
    descriptors?: string[];
  };
  const currentFeatures = (voice?.features ?? {}) as {
    hook_patterns?: string[];
    positive_examples?: string[];
  };

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h2 className="font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          Muse — your voice
        </h2>
        <p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
          Muse is Aloha&apos;s style-trained AI layer. Train it on your own
          writing and the sliders you pick below; every Muse-enabled channel
          then generates in that voice. You can retrain any time — the
          profile&apos;s versioned.
        </p>
      </div>

      <FlashToast
        entries={[
          {
            param: "notion",
            value: "connected",
            type: "success",
            message:
              "Notion connected. Run a sync below to pull your pages into the corpus.",
          },
          {
            param: "notion",
            value: "error",
            type: "error",
            message:
              "Couldn't connect Notion. Make sure OAuth is enabled and the redirect URI matches.",
          },
        ]}
      />


      <KnowledgeSources notion={notion} corpus={corpusRows} />

      {voice ? (
        <CurrentVoiceCard
          voice={voice}
          tone={currentTone}
          features={currentFeatures}
          channelCounts={mergedChannelCounts}
          channelDeltas={channelDeltas}
        />
      ) : null}

      <TrainingSourcesCard
        internalPostCount={internalPostStats.total}
        channelSampleCount={channelCounts.reduce((sum, c) => sum + c.count, 0)}
        notionDocCount={corpusRows.filter((c) => c.source === "notion").length}
        ideaCount={ideaCount}
      />

      <form action={trainVoiceAction} className="space-y-8">
        <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-6">
          <header className="flex items-start gap-3">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Wand2 className="w-4 h-4 text-ink" />
            </span>
            <div>
              <p className="text-[14.5px] text-ink font-medium">How should Muse sound?</p>
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
                Steer the voice alongside your writing. Works on its own too,
                if your corpus is still thin.
              </p>
            </div>
          </header>

          <div className="grid gap-6">
            <Slider name="formality" label="Casual ↔ Formal" />
            <Slider name="detail" label="Concise ↔ Detailed" />
            <Slider name="wit" label="Earnest ↔ Witty" />
            <PerspectivePicker />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-4">
          <header className="flex items-start gap-3">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Upload className="w-4 h-4 text-ink" />
            </span>
            <div>
              <p className="text-[14.5px] text-ink font-medium">Paste additional text</p>
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
                Newsletter drafts, blog posts, anything else that sounds like
                you. Optional.
              </p>
            </div>
          </header>
          <textarea
            name="uploadedCorpus"
            placeholder="Paste posts, newsletters, transcripts — anything that sounds like you."
            className="w-full min-h-[160px] rounded-xl border border-border bg-background px-4 py-3 text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
          />
        </section>

        <div className="flex items-center justify-end gap-3">
          <p className="text-[12px] text-ink/55">
            Training takes a few seconds.
          </p>
          <PendingSubmitButton
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            pendingLabel={voice ? "Retraining…" : "Training…"}
          >
            <Wand2 className="w-4 h-4" />
            {voice ? "Retrain voice" : "Train voice"}
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}


function PerspectivePicker() {
  const options = [
    { value: "first-person", label: "I / me" },
    { value: "third-person", label: "They / the team" },
    { value: "mixed", label: "Mixed" },
  ] as const;
  return (
    <fieldset>
      <legend className="text-[13px] text-ink/75">Perspective</legend>
      <div className="mt-2 flex gap-2 flex-wrap">
        {options.map((opt, idx) => (
          <label
            key={opt.value}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-border bg-background text-[12.5px] text-ink/75 cursor-pointer has-[:checked]:bg-ink has-[:checked]:text-background has-[:checked]:border-ink"
          >
            <input
              type="radio"
              name="perspective"
              value={opt.value}
              defaultChecked={idx === 2}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type ChannelDelta = {
  channel: string;
  delta: {
    summary: string;
    sample_count: number;
    tone_descriptors?: string[];
    hook_patterns?: string[];
    cta_style?: string;
    emoji_rate?: string;
  };
  version: number;
  updatedAt: Date;
};

function CurrentVoiceCard({
  voice,
  tone,
  features,
  channelCounts,
  channelDeltas,
}: {
  voice: { trainedAt: Date | null; version: number; emojiRate: string | null; bannedPhrases: string[]; ctaStyle: string | null };
  tone: { summary?: string; descriptors?: string[] };
  features: { hook_patterns?: string[]; positive_examples?: string[] };
  channelCounts: Array<{ platform: string; count: number }>;
  channelDeltas: ChannelDelta[];
}) {
  return (
    <section className="rounded-3xl border border-border bg-peach-100/50 p-6 space-y-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Current voice · v{voice.version}
          </p>
          <p className="mt-2 font-display text-[22px] leading-[1.2] text-ink">
            {tone.summary ?? "Profile trained."}
          </p>
        </div>
        {voice.trainedAt ? (
          <p className="text-[12px] text-ink/55">
            Trained{" "}
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(voice.trainedAt)}
          </p>
        ) : null}
      </div>
      <dl className="columns-1 sm:columns-2 gap-x-6 text-[13px] [column-fill:_balance]">
        {tone.descriptors && tone.descriptors.length > 0 ? (
          <Field label="Tone">{tone.descriptors.join(" · ")}</Field>
        ) : null}
        {features.hook_patterns && features.hook_patterns.length > 0 ? (
          <Field label="Hooks">{features.hook_patterns.join(" · ")}</Field>
        ) : null}
        {voice.ctaStyle ? <Field label="CTA style">{voice.ctaStyle}</Field> : null}
        {voice.emojiRate ? (
          <Field label="Emoji rate">{voice.emojiRate}</Field>
        ) : null}
        {voice.bannedPhrases.length > 0 ? (
          <Field label="Avoid">{voice.bannedPhrases.join(", ")}</Field>
        ) : null}
      </dl>

      <ChannelTuning counts={channelCounts} deltas={channelDeltas} />
    </section>
  );
}

function ChannelTuning({
  counts,
  deltas,
}: {
  counts: Array<{ platform: string; count: number }>;
  deltas: ChannelDelta[];
}) {
  const byChannel = new Map(counts.map((c) => [c.platform, c.count]));
  for (const d of deltas) {
    if (!byChannel.has(d.channel))
      byChannel.set(d.channel, d.delta.sample_count);
  }
  const deltaByChannel = new Map(deltas.map((d) => [d.channel, d]));
  const rows = Array.from(byChannel.entries()).sort((a, b) => b[1] - a[1]);

  const hasTrained = deltas.length > 0;
  const hasSamples = rows.length > 0;

  return (
    <div className="pt-5 border-t border-ink/10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
        Channel tuning
      </p>

      {!hasTrained && !hasSamples ? (
        <p className="mt-2 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
          Connect and sync a channel to unlock channel-specific tuning once it
          has {CHANNEL_DELTA_MIN_SAMPLES}+ posts. Until then, every channel
          uses the global voice above.
        </p>
      ) : !hasTrained ? (
        <>
          <p className="mt-2 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
            Muse trains a lightweight per-channel delta once a channel has{" "}
            {CHANNEL_DELTA_MIN_SAMPLES}+ posts. Others stay on the global
            voice.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-ink/60">
            {rows.map(([channel, count]) => (
              <li key={channel} className="tabular-nums">
                <span className="capitalize text-ink/75">{channel}</span>{" "}
                {Math.min(count, CHANNEL_DELTA_MIN_SAMPLES)}/
                {CHANNEL_DELTA_MIN_SAMPLES}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/10 overflow-hidden bg-background/60">
          {rows.map(([channel, count]) => {
            const delta = deltaByChannel.get(channel);
            const trained = !!delta;
            return (
              <li key={channel} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-ink font-medium capitalize">
                      {channel}
                    </span>
                    <span className="text-[11.5px] text-ink/55 tabular-nums">
                      {count} sample{count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] uppercase tracking-[0.16em] ${
                      trained ? "text-ink" : "text-ink/45"
                    }`}
                  >
                    {trained
                      ? `Tuned · v${delta.version}`
                      : `Need ${Math.max(CHANNEL_DELTA_MIN_SAMPLES - count, 0)} more`}
                  </span>
                </div>
                {trained && delta.delta.tone_descriptors?.length ? (
                  <p className="text-[11.5px] text-ink/60">
                    Shift: {delta.delta.tone_descriptors.join(" · ")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TrainingSourcesCard({
  internalPostCount,
  channelSampleCount,
  notionDocCount,
  ideaCount,
}: {
  internalPostCount: number;
  channelSampleCount: number;
  notionDocCount: number;
  ideaCount: number;
}) {
  const rows: Array<{ label: string; count: number; hint: string }> = [
    {
      label: "Aloha posts",
      count: internalPostCount,
      hint: "drafts, scheduled, published",
    },
    {
      label: "Channel posts",
      count: channelSampleCount,
      hint: "synced from connected channels",
    },
    {
      label: "Notion docs",
      count: notionDocCount,
      hint: "from your knowledge sources",
    },
    {
      label: "Ideas",
      count: ideaCount,
      hint: "captured notes and clips",
    },
  ];

  return (
    <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-4">
      <header className="flex items-start gap-3">
        <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
          <Sparkles className="w-4 h-4 text-ink" />
        </span>
        <div>
          <p className="text-[14.5px] text-ink font-medium">Training sources</p>
          <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
            What Muse reads when you train. All of this feeds the voice
            profile automatically — no picking needed.
          </p>
        </div>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-[13px] text-ink font-medium">{r.label}</p>
              <p className="text-[11.5px] text-ink/55 leading-[1.5]">
                {r.hint}
              </p>
            </div>
            <span
              className={`text-[15px] font-display tabular-nums ${
                r.count === 0 ? "text-ink/40" : "text-ink"
              }`}
            >
              {r.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 break-inside-avoid">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-ink/50">
        {label}
      </dt>
      <dd className="mt-1 text-ink/80">{children}</dd>
    </div>
  );
}

type NotionConnection = {
  workspaceId: string;
  workspaceName: string | null;
  workspaceIcon: string | null;
  reauthRequired: boolean;
  lastSyncedAt: Date | null;
} | null;

type CorpusRow = {
  source: string;
  title: string | null;
  fetchedAt: Date;
};

function KnowledgeSources({
  notion,
  corpus,
}: {
  notion: NotionConnection;
  corpus: CorpusRow[];
}) {
  const notionDocs = corpus.filter((c) => c.source === "notion");
  return (
    <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-6">
      <header className="flex items-start gap-3">
        <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
          <BookOpen className="w-4 h-4 text-ink" />
        </span>
        <div>
          <p className="text-[14.5px] text-ink font-medium">
            Knowledge sources
          </p>
          <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
            Connect your writing workspace so Muse trains on the work that
            actually sounds like you, not just your latest posts.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <NotionTile notion={notion} docCount={notionDocs.length} />
        <GoogleDocsTile />
      </div>

      {notionDocs.length > 0 ? (
        <NotionDocList docs={notionDocs} />
      ) : null}
    </section>
  );
}

function NotionTile({
  notion,
  docCount,
}: {
  notion: NotionConnection;
  docCount: number;
}) {
  if (!notion) {
    return (
      <article className="rounded-2xl border border-border bg-background p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 text-[13.5px] text-ink font-medium">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-background border border-border text-ink">
            <NotionIcon className="w-3.5 h-3.5" />
          </span>
          Notion
        </div>
        <p className="mt-2 text-[12.5px] text-ink/60 leading-[1.55]">
          Share pages with the Aloha integration and we&apos;ll pull them into
          your corpus on a schedule.
        </p>
        <div className="mt-auto pt-4">
          <Link
            href="/api/notion/connect"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Connect Notion
          </Link>
        </div>
      </article>
    );
  }

  if (notion.reauthRequired) {
    return (
      <article className="rounded-2xl border border-primary/40 bg-primary-soft/60 p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 text-[13.5px] text-ink font-medium">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-background border border-border text-ink">
            <NotionIcon className="w-3.5 h-3.5" />
          </span>
          Notion · reconnect needed
        </div>
        <p className="mt-2 text-[12.5px] text-ink/70 leading-[1.55]">
          Your integration&apos;s access was revoked, so we&apos;ve paused
          syncs. Reconnect to resume — your previously synced documents stay
          in the corpus.
        </p>
        <div className="mt-auto pt-4">
          <Link
            href="/api/notion/connect"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Reconnect Notion
          </Link>
        </div>
      </article>
    );
  }

  const lastSynced = notion.lastSyncedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(notion.lastSyncedAt)
    : null;

  return (
    <article className="rounded-2xl border border-primary/40 bg-primary-soft/40 p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 text-[13.5px] text-ink font-medium">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-background border border-border text-ink">
          <NotionIcon className="w-3.5 h-3.5" />
        </span>
        Notion · {notion.workspaceName ?? notion.workspaceId.slice(0, 8)}
      </div>
      <p className="mt-2 text-[12.5px] text-ink/65 leading-[1.55]">
        {docCount === 0
          ? "Connected, but no documents pulled yet. Run a sync to ingest."
          : `${docCount} document${docCount === 1 ? "" : "s"} in your corpus${lastSynced ? ` · last synced ${lastSynced}` : ""}.`}
      </p>
      <div className="mt-auto pt-4 flex items-center gap-2">
        <form action={syncNotionAction}>
          <SyncNotionButton />
        </form>
        <DisconnectNotionButton />
      </div>
    </article>
  );
}

function GoogleDocsTile() {
  return (
    <article className="rounded-2xl border border-dashed border-border-strong p-5">
      <div className="flex items-center gap-2 text-[13.5px] text-ink/70 font-medium">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-background border border-border">
          <GoogleIcon className="w-3.5 h-3.5" />
        </span>
        Google Docs
      </div>
      <p className="mt-2 text-[12.5px] text-ink/55 leading-[1.55]">
        Pick specific Docs or a Drive folder. Coming shortly — we&apos;re
        finalising the narrow read-only scopes we want to request.
      </p>
      <span className="mt-4 inline-flex items-center h-10 px-4 rounded-full border border-dashed border-border-strong text-[13px] text-ink/45">
        Coming soon
      </span>
    </article>
  );
}

function NotionDocList({ docs }: { docs: CorpusRow[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50 mb-2">
        Most recently synced
      </p>
      <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {docs.slice(0, 6).map((d, idx) => (
          <li
            key={`${d.source}-${idx}`}
            className="px-4 py-2.5 flex items-center justify-between text-[13px]"
          >
            <span className="text-ink/80 truncate pr-4">
              {d.title ?? "Untitled"}
            </span>
            <span className="text-[11.5px] text-ink/50 shrink-0 tabular-nums">
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(d.fetchedAt)}
            </span>
          </li>
        ))}
      </ul>
      {docs.length > 6 ? (
        <p className="mt-2 text-[11.5px] text-ink/50">
          + {docs.length - 6} more in your corpus.
        </p>
      ) : null}
    </div>
  );
}

const MUSE_BENEFITS: Array<{ Icon: typeof Sparkles; title: string; body: string }> = [
  {
    Icon: Wand2,
    title: "Train Muse on your voice",
    body: "Feed it your past posts, sliders, and sample writing. Every generation then sounds like you — not a generic AI.",
  },
  {
    Icon: BookOpen,
    title: "Pull in your knowledge",
    body: "Connect Notion (and Google Docs, soon) so Muse drafts with the context of your actual work, not just the last tweet.",
  },
  {
    Icon: Sparkles,
    title: "Full drafts, not just polish",
    body: "Go from topic to on-brand draft with hooks, key points, CTA, and hashtags — per platform.",
  },
  {
    Icon: ImageIcon,
    title: "On-brand images",
    body: "Generate visuals that match your post, ready to attach without leaving the composer.",
  },
];

function MuseRequestAccess({ requestedAt }: { requestedAt: Date | null }) {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Invite-only
        </p>
        <h2 className="mt-2 font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          Muse — join the waitlist
        </h2>
        <p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
          Muse is Aloha&apos;s style-trained AI layer. We&apos;re rolling it
          out to a small group while we tune it. Register your interest and
          we&apos;ll email you when your seat opens.
        </p>
      </div>

      <section className="rounded-3xl border border-border bg-background-elev p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          What you unlock
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {MUSE_BENEFITS.map(({ Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
                <Icon className="w-4 h-4 text-ink" />
              </span>
              <div>
                <p className="text-[14px] text-ink font-medium">{title}</p>
                <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55]">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {requestedAt ? (
        <section className="rounded-3xl border border-primary/40 bg-primary-soft/60 p-6 flex items-start gap-3">
          <span className="mt-[2px] w-9 h-9 rounded-full bg-background border border-primary/40 grid place-items-center shrink-0">
            <Check className="w-4 h-4 text-ink" />
          </span>
          <div>
            <p className="text-[14.5px] text-ink font-medium">
              You&apos;re on the list
            </p>
            <p className="mt-1 text-[12.5px] text-ink/70 leading-[1.55]">
              Requested{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(requestedAt)}
              . We&apos;ll email you as soon as access opens up.
            </p>
          </div>
        </section>
      ) : (
        <form
          action={requestMuseAccessAction}
          className="rounded-3xl border border-border bg-background-elev p-6 flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <p className="text-[14.5px] text-ink font-medium">
              Ready when you are
            </p>
            <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55]">
              One click — we&apos;ll reach out when your seat is ready.
            </p>
          </div>
          <PendingSubmitButton
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            pendingLabel="Registering…"
          >
            <Sparkles className="w-4 h-4" />
            Request access
          </PendingSubmitButton>
        </form>
      )}
    </div>
  );
}
