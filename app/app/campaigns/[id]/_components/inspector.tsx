import {
  addSiblingBeatAction,
  deleteBeatAction,
  editBeatAction,
  regenerateCampaignBeatAction,
  rescheduleBeatAction,
} from "@/app/actions/campaigns";
import { ChannelChip } from "@/components/channel-chip";
import { type CampaignBeat } from "@/lib/ai/campaign";
import { formatsFor } from "@/lib/campaigns/channel-formats";
import { cn } from "@/lib/utils";
import {
  Check,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { FormatSelect } from "./format-select";

const PHASE_LABELS: Record<string, string> = {
  teaser: "Teaser",
  announce: "Announce",
  social_proof: "Social proof",
  urgency: "Urgency",
  last_call: "Last call",
  recap: "Recap",
  reminder: "Reminder",
  follow_up: "Follow-up",
};

const PHASE_STYLES: Record<string, string> = {
  teaser: "bg-peach-100 text-ink border-peach-300",
  announce: "bg-ink text-background border-ink",
  social_proof: "bg-primary-soft text-primary-deep border-primary/40",
  urgency: "bg-primary-soft text-primary-deep border-primary/40",
  last_call: "bg-primary-soft text-primary-deep border-primary/40",
  recap: "bg-background text-ink/70 border-border-strong",
  reminder: "bg-peach-100 text-ink border-peach-300",
  follow_up: "bg-background text-ink/70 border-border-strong",
};

export function BeatInspector({
  campaignId,
  beat,
}: {
  campaignId: string;
  beat: CampaignBeat;
}) {
  const formatOpts = formatsFor(beat.channel);
  const accepted = Boolean(beat.accepted);
  const otherFormats = formatOpts.filter((f) => f.slug !== beat.format);

  return (
    <aside className="rounded-3xl border border-border-strong bg-background-elev p-5 space-y-5 lg:sticky lg:top-6">
      <header className="space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center h-5 px-2 rounded-full border text-[10.5px] font-medium tracking-wide",
              PHASE_STYLES[beat.phase] ?? PHASE_STYLES.announce,
            )}
          >
            {PHASE_LABELS[beat.phase] ?? beat.phase}
          </span>
          <ChannelChip channel={beat.channel} />
          {accepted ? (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] tracking-wide">
              <Check className="w-3 h-3" />
              Drafted
            </span>
          ) : null}
        </div>
        <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink/45">
          Selected beat
        </p>
      </header>

      <Row label="Date">
        {accepted ? (
          <span className="text-[13px] text-ink">{beat.date}</span>
        ) : (
          <form
            action={rescheduleBeatAction}
            className="inline-flex items-center gap-2"
          >
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="beatId" value={beat.id} />
            <input
              type="date"
              name="date"
              defaultValue={beat.date}
              className="h-9 px-3 rounded-full border border-border bg-background text-[12.5px] text-ink focus:outline-none focus:border-ink"
            />
            <button
              type="submit"
              className="inline-flex items-center h-8 px-3 rounded-full border border-border text-[11.5px] text-ink/70 hover:border-ink hover:text-ink transition-colors"
            >
              Save
            </button>
          </form>
        )}
      </Row>

      <Row label="Format">
        {accepted ? (
          <span className="text-[13px] text-ink capitalize">{beat.format}</span>
        ) : (
          <FormatSelect
            campaignId={campaignId}
            beatId={beat.id}
            current={beat.format}
            options={formatOpts}
          />
        )}
      </Row>

      {accepted ? (
        <ReadOnlyBody beat={beat} />
      ) : (
        <form
          action={editBeatAction}
          className="space-y-3.5 border-t border-border pt-4"
        >
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="beatId" value={beat.id} />

          <FieldLabel label="Title">
            <input
              name="title"
              defaultValue={beat.title}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13.5px] text-ink focus:outline-none focus:border-ink"
            />
          </FieldLabel>

          <FieldLabel label="Angle">
            <textarea
              name="angle"
              defaultValue={beat.angle}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] text-ink focus:outline-none focus:border-ink resize-y"
            />
          </FieldLabel>

          <FieldLabel label="Hook">
            <textarea
              name="hook"
              defaultValue={beat.hook ?? ""}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] text-ink focus:outline-none focus:border-ink resize-y"
            />
          </FieldLabel>

          <FieldLabel label="Key points (one per line)">
            <textarea
              name="keyPoints"
              defaultValue={(beat.keyPoints ?? []).join("\n")}
              rows={5}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] text-ink focus:outline-none focus:border-ink font-mono resize-y"
            />
          </FieldLabel>

          <FieldLabel label="CTA">
            <input
              name="cta"
              defaultValue={beat.cta ?? ""}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink focus:outline-none focus:border-ink"
            />
          </FieldLabel>

          <FieldLabel label="Hashtags (space or comma separated)">
            <input
              name="hashtags"
              defaultValue={(beat.hashtags ?? []).join(" ")}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[13px] text-ink focus:outline-none focus:border-ink"
            />
          </FieldLabel>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="submit"
              className="inline-flex items-center h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors"
            >
              Save edits
            </button>
            <RegenAndDeleteRow campaignId={campaignId} beatId={beat.id} />
          </div>
        </form>
      )}

      {!accepted && otherFormats.length > 0 ? (
        <div className="border-t border-border pt-4 space-y-2.5">
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink/45">
            Add another format for this slot
          </p>
          <p className="text-[12px] text-ink/55 leading-[1.5]">
            Same date and channel, different format — Muse drafts the
            scaffolding for you.
          </p>
          <div className="flex flex-wrap gap-2">
            {otherFormats.map((f) => (
              <form
                key={f.slug}
                action={addSiblingBeatAction}
                className="inline-flex"
              >
                <input type="hidden" name="campaignId" value={campaignId} />
                <input type="hidden" name="sourceBeatId" value={beat.id} />
                <input type="hidden" name="targetFormat" value={f.slug} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-border text-[12px] text-ink/75 hover:border-ink hover:text-ink transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {f.label}
                </button>
              </form>
            ))}
          </div>
        </div>
      ) : null}

      {accepted && beat.acceptedPostId ? (
        <Link
          href={`?compose=${beat.acceptedPostId}`}
          prefetch={false}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
        >
          Open in composer →
        </Link>
      ) : null}
    </aside>
  );
}

export function CampaignOverview({
  beats,
}: {
  beats: CampaignBeat[];
}) {
  if (beats.length === 0) {
    return (
      <aside className="rounded-3xl border border-dashed border-border-strong bg-background-elev p-6 text-center lg:sticky lg:top-6">
        <Sparkles className="w-5 h-5 text-ink/40 mx-auto" />
        <p className="mt-3 text-[13px] text-ink/60">
          No beats yet — generate one to begin.
        </p>
      </aside>
    );
  }

  const byChannel = countBy(beats, (b) => b.channel);
  const byFormat = countBy(beats, (b) => b.format);
  const byPhase = countBy(beats, (b) => b.phase);

  const accepted = beats.filter((b) => b.accepted).length;
  const total = beats.length;

  return (
    <aside className="rounded-3xl border border-border-strong bg-background-elev p-5 space-y-5 lg:sticky lg:top-6">
      <header>
        <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink/45">
          Campaign at a glance
        </p>
        <p className="mt-2 text-[13px] text-ink/65 leading-[1.55]">
          Pick a beat from the list to edit it, switch its format, or add a
          sibling.
        </p>
      </header>

      <Stat label="Drafted" value={`${accepted} / ${total}`} />

      <BarBlock label="Channels" rows={byChannel} />
      <BarBlock label="Formats" rows={byFormat} />
      <BarBlock label="Phases" rows={byPhase} />
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10.5px] uppercase tracking-[0.18em] text-ink/45">
        {label}
      </span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10.5px] uppercase tracking-[0.18em] text-ink/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function RegenAndDeleteRow({
  campaignId,
  beatId,
}: {
  campaignId: string;
  beatId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <form action={regenerateCampaignBeatAction}>
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="beatId" value={beatId} />
        <button
          type="submit"
          title="Regenerate this beat"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border text-[11.5px] text-ink/65 hover:text-ink hover:border-ink transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerate
        </button>
      </form>
      <form action={deleteBeatAction}>
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="beatId" value={beatId} />
        <button
          type="submit"
          title="Delete this beat"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border text-ink/55 hover:text-ink hover:border-ink transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

function ReadOnlyBody({ beat }: { beat: CampaignBeat }) {
  return (
    <div className="space-y-2.5 border-t border-border pt-4">
      <p className="text-[14.5px] text-ink font-medium leading-[1.3]">
        {beat.title}
      </p>
      {beat.angle ? (
        <p className="text-[13px] text-ink/70 leading-[1.55]">{beat.angle}</p>
      ) : null}
      {beat.hook ? (
        <p className="rounded-xl bg-muted/40 border border-border px-3 py-2 text-[13px] text-ink leading-[1.5]">
          <span className="block text-[10.5px] uppercase tracking-[0.18em] text-ink/50 mb-1">
            Hook
          </span>
          {beat.hook}
        </p>
      ) : null}
      {beat.keyPoints && beat.keyPoints.length > 0 ? (
        <ol className="list-decimal pl-5 space-y-1 text-[13px] text-ink/80 leading-[1.5]">
          {beat.keyPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      ) : null}
      {beat.cta ? (
        <p className="text-[13px] text-ink/80">
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-ink/50 mr-1.5">
            CTA
          </span>
          {beat.cta}
        </p>
      ) : null}
      {beat.hashtags && beat.hashtags.length > 0 ? (
        <p className="text-[12.5px] text-ink/60 break-words">
          {beat.hashtags.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink/45">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-display tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

function BarBlock({
  label,
  rows,
}: {
  label: string;
  rows: Array<{ key: string; count: number }>;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <div className="space-y-1.5">
      <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink/45">
        {label}
      </p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3">
            <span className="text-[12px] text-ink/70 capitalize w-24 truncate">
              {r.key.replace(/_/g, " ")}
            </span>
            <span className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <span
                className="block h-full bg-primary"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </span>
            <span className="text-[11.5px] text-ink/55 tabular-nums w-6 text-right">
              {r.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function countBy<T>(
  items: T[],
  keyFn: (t: T) => string,
): Array<{ key: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}
