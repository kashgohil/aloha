import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { BookOpen, Link2, Sparkles, Upload, Wand2 } from "lucide-react";
import { db } from "@/db";
import {
  brandCorpus,
  notionCredentials,
  platformContentCache,
} from "@/db/schema";
import { trainVoiceAction } from "@/app/actions/voice";
import {
  syncNotionAction,
} from "@/app/actions/corpus";
import { loadCurrentVoice } from "@/lib/ai/voice";
import { getCurrentUser } from "@/lib/current-user";
import { Slider } from "./_components/slider";
import { SyncNotionButton } from "./_components/sync-button";
import { DisconnectNotionButton } from "./_components/disconnect-confirm";
import { GoogleIcon, NotionIcon } from "@/app/auth/_components/provider-icons";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RECENT_SAMPLE_LIMIT = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const firstParam = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function MuseSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;

  const [voice, recentSamples, notion, corpusRows] = await Promise.all([
    loadCurrentVoice(user.id),
    db
      .select({
        id: platformContentCache.id,
        platform: platformContentCache.platform,
        content: platformContentCache.content,
        platformPostedAt: platformContentCache.platformPostedAt,
      })
      .from(platformContentCache)
      .where(and(eq(platformContentCache.userId, user.id)))
      .orderBy(desc(platformContentCache.platformPostedAt))
      .limit(RECENT_SAMPLE_LIMIT),
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
  ]);

  const notionFlash = firstParam(params.notion);

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

      {notionFlash === "connected" ? (
        <p className="rounded-2xl border border-primary/40 bg-primary-soft/50 px-4 py-3 text-[13px] text-ink">
          Notion workspace connected. Run a sync below to pull your pages into
          the corpus.
        </p>
      ) : null}
      {notionFlash === "error" ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Couldn&apos;t connect Notion. Try again — if it keeps failing, make
          sure your integration has OAuth enabled and the redirect URI matches.
        </p>
      ) : null}

      <KnowledgeSources notion={notion} corpus={corpusRows} />

      {voice ? <CurrentVoiceCard voice={voice} tone={currentTone} features={currentFeatures} /> : null}

      <form action={trainVoiceAction} className="space-y-8">
        <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-6">
          <header className="flex items-start gap-3">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Wand2 className="w-4 h-4 text-ink" />
            </span>
            <div>
              <p className="text-[14.5px] text-ink font-medium">Voice sliders</p>
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
                The trainer reads these alongside your corpus. Even with no
                corpus, the sliders are enough to produce a working baseline.
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
              <Sparkles className="w-4 h-4 text-ink" />
            </span>
            <div>
              <p className="text-[14.5px] text-ink font-medium">Pull your past posts</p>
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
                Pick posts that sound most like you. Leave unchecked and
                we&apos;ll auto-pick the most recent 100 across every
                connected channel.
              </p>
            </div>
          </header>

          {recentSamples.length === 0 ? (
            <p className="text-[12.5px] text-ink/60 leading-[1.55]">
              No posts cached yet. The nightly read-back will populate this
              after your next sync. You can still train from the sliders and
              uploaded text below.
            </p>
          ) : (
            <SamplePicker samples={recentSamples} />
          )}
        </section>

        <section className="rounded-3xl border border-border bg-background-elev p-6 space-y-4">
          <header className="flex items-start gap-3">
            <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
              <Upload className="w-4 h-4 text-ink" />
            </span>
            <div>
              <p className="text-[14.5px] text-ink font-medium">Paste additional text</p>
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55] max-w-2xl">
                Newsletter drafts, blog posts, anything that sounds like you.
                Optional — mix with sample posts or use on its own.
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
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            {voice ? "Retrain voice" : "Train voice"}
          </button>
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

function SamplePicker({
  samples,
}: {
  samples: Array<{
    id: string;
    platform: string;
    content: string;
    platformPostedAt: Date | null;
  }>;
}) {
  return (
    <>
      <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {samples.map((s) => (
          <li key={s.id} className="flex items-start gap-3 px-4 py-3">
            <input
              type="checkbox"
              name="samplePostIds"
              value={s.id}
              className="mt-1 accent-ink"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-ink/55 uppercase tracking-[0.16em]">
                <span>{s.platform}</span>
                {s.platformPostedAt ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(s.platformPostedAt)}
                    </span>
                  </>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] text-ink/80 leading-[1.5] line-clamp-3">
                {s.content}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11.5px] text-ink/50">
        Leave all unchecked to auto-pick the most recent 100 posts across every
        connected channel.
      </p>
    </>
  );
}

function CurrentVoiceCard({
  voice,
  tone,
  features,
}: {
  voice: { trainedAt: Date | null; version: number; emojiRate: string | null; bannedPhrases: string[]; ctaStyle: string | null };
  tone: { summary?: string; descriptors?: string[] };
  features: { hook_patterns?: string[]; positive_examples?: string[] };
}) {
  return (
    <section className="rounded-3xl border border-border bg-peach-100/50 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
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
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
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
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
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
      <article className="rounded-2xl border border-border bg-background p-5">
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
        <Link
          href="/api/notion/connect"
          className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
        >
          <Link2 className="w-3.5 h-3.5" />
          Connect Notion
        </Link>
      </article>
    );
  }

  if (notion.reauthRequired) {
    return (
      <article className="rounded-2xl border border-primary/40 bg-primary-soft/60 p-5">
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
        <Link
          href="/api/notion/connect"
          className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
        >
          <Link2 className="w-3.5 h-3.5" />
          Reconnect Notion
        </Link>
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
    <article className="rounded-2xl border border-primary/40 bg-primary-soft/40 p-5">
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
      <div className="mt-4 flex items-center gap-2">
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
