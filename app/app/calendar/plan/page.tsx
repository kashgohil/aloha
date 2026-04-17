import { and, eq, notInArray } from "drizzle-orm";
import {
  ArrowLeft,
  Check,
  Calendar as CalendarIcon,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import {
  acceptPlanIdeasAction,
  createPlanAction,
  regeneratePlanDayAction,
} from "@/app/actions/plan";
import { AUTH_ONLY_PROVIDERS } from "@/lib/auth-providers";
import { loadPlan, type PlanIdea } from "@/lib/ai/plan";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function PlanPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const planId = first(params.id) ?? null;
  const acceptedFlash = first(params.accepted) === "1";

  const plan = planId ? await loadPlan(user.id, planId) : null;

  if (plan) {
    return (
      <PlanReview plan={plan} acceptedFlash={acceptedFlash} />
    );
  }

  const connected = await db
    .selectDistinct({ provider: accounts.provider })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, user.id),
        notInArray(accounts.provider, AUTH_ONLY_PROVIDERS),
      ),
    );
  const channels = connected.map((c) => c.provider);

  const today = new Date();
  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 13);
  const defaultStart = today.toISOString().slice(0, 10);
  const defaultEnd = twoWeeks.toISOString().slice(0, 10);

  return <PlanForm channels={channels} defaultStart={defaultStart} defaultEnd={defaultEnd} />;
}

// ---- Form view ------------------------------------------------------------

const CHANNEL_LABELS: Record<string, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  threads: "Threads",
  bluesky: "Bluesky",
  medium: "Medium",
  reddit: "Reddit",
  pinterest: "Pinterest",
  mastodon: "Mastodon",
};

function PlanForm({
  channels,
  defaultStart,
  defaultEnd,
}: {
  channels: string[];
  defaultStart: string;
  defaultEnd: string;
}) {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href="/app/calendar"
          className="inline-flex items-center gap-1 text-[12.5px] text-ink/55 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to calendar
        </Link>
        <h1 className="mt-4 font-display text-[44px] leading-[1.05] tracking-[-0.02em] text-ink">
          Plan with <span className="text-primary font-light">Muse</span>
        </h1>
        <p className="mt-3 text-[14px] text-ink/65 leading-[1.55] max-w-2xl">
          Tell Muse what you&apos;re going after. It drafts a schedule of
          ideas — day, channel, angle, format — that you review and accept
          into your calendar. Nothing commits without your click.
        </p>
      </div>

      {channels.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border-strong bg-background-elev px-6 py-10 text-center">
          <p className="text-[14px] text-ink font-medium">
            Connect a channel first.
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60 max-w-md mx-auto leading-[1.55]">
            The plan needs at least one channel to target. Head to{" "}
            <Link href="/app/settings/channels" className="underline">
              Settings → Channels
            </Link>{" "}
            to connect one.
          </p>
        </div>
      ) : (
        <form
          action={createPlanAction}
          className="rounded-3xl border border-border bg-background-elev p-6 space-y-6"
        >
          <Field label="Goal" hint="What are you trying to achieve over this run?">
            <input
              name="goal"
              required
              placeholder="e.g. grow the newsletter to 5k subscribers by end of month"
              className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
            />
          </Field>

          <Field
            label="Themes"
            hint="Comma-separated. Optional but helpful — Muse will bias toward these."
          >
            <input
              name="themes"
              placeholder="e.g. first-principles thinking, founder essays, pricing"
              className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
            />
          </Field>

          <Field label="Channels" hint="Pick where these posts should go.">
            <ChannelPicker channels={channels} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Posts per week">
              <input
                name="frequency"
                type="number"
                min={1}
                max={14}
                defaultValue={5}
                className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink focus:outline-none focus:border-ink"
              />
            </Field>
            <Field label="Start">
              <input
                name="rangeStart"
                type="date"
                defaultValue={defaultStart}
                required
                className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink focus:outline-none focus:border-ink"
              />
            </Field>
            <Field label="End">
              <input
                name="rangeEnd"
                type="date"
                defaultValue={defaultEnd}
                required
                className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] text-ink focus:outline-none focus:border-ink"
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
            <p className="text-[12px] text-ink/55">
              Muse uses your voice, best-time history, and recent feed items
              as context.
            </p>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Draft the plan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11.5px] uppercase tracking-[0.18em] text-ink/55 font-medium">
        {label}
      </span>
      {hint ? <span className="block text-[12px] text-ink/55">{hint}</span> : null}
      {children}
    </label>
  );
}

function ChannelPicker({ channels }: { channels: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {channels.map((c) => (
        <label
          key={c}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-background text-[13px] text-ink cursor-pointer has-[:checked]:bg-ink has-[:checked]:text-background has-[:checked]:border-ink"
        >
          <input
            type="checkbox"
            name="channels"
            value={c}
            defaultChecked
            className="sr-only"
          />
          {CHANNEL_LABELS[c] ?? c}
        </label>
      ))}
    </div>
  );
}

// ---- Review view ----------------------------------------------------------

function PlanReview({
  plan,
  acceptedFlash,
}: {
  plan: NonNullable<Awaited<ReturnType<typeof loadPlan>>>;
  acceptedFlash: boolean;
}) {
  // Group by day for visual grouping.
  const byDate = new Map<string, PlanIdea[]>();
  for (const idea of plan.ideas) {
    const list = byDate.get(idea.date) ?? [];
    list.push(idea);
    byDate.set(idea.date, list);
  }
  const dates = Array.from(byDate.keys()).sort();

  const accepted = plan.ideas.filter((i) => i.accepted).length;
  const pending = plan.ideas.length - accepted;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/calendar"
          className="inline-flex items-center gap-1 text-[12.5px] text-ink/55 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to calendar
        </Link>
        <h1 className="mt-4 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
          {plan.goal}
        </h1>
        <p className="mt-3 text-[13.5px] text-ink/65 leading-[1.55]">
          {plan.ideas.length} ideas over{" "}
          {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
            plan.rangeStart,
          )}{" "}
          →{" "}
          {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
            plan.rangeEnd,
          )}
          {" · "}
          {accepted > 0 ? `${accepted} accepted · ` : ""}
          {pending} pending
        </p>
      </div>

      {acceptedFlash && accepted > 0 ? (
        <div className="rounded-2xl border border-primary/40 bg-primary-soft/50 px-4 py-3 flex items-center gap-2 text-[13px] text-ink">
          <Check className="w-4 h-4 text-primary" />
          Drafts created. Tune them in the composer, or see them on the
          <Link href="/app/calendar" className="underline ml-1">
            calendar
          </Link>
          .
        </div>
      ) : null}

      {/* The accept form is declared up top with an id; checkboxes + the
          submit button reference it via the `form` attribute. This lets the
          regen-day forms live as DOM siblings (nested forms would be
          invalid HTML). */}
      <form
        id="plan-accept-form"
        action={acceptPlanIdeasAction}
        className="contents"
      >
        <input type="hidden" name="planId" value={plan.id} />
      </form>

      <div className="space-y-6">
        {dates.map((date) => {
          const dayIdeas = byDate.get(date) ?? [];
          const pendingOnDay = dayIdeas.filter((i) => !i.accepted).length;
          return (
            <section key={date} className="space-y-2">
              <header className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11.5px] uppercase tracking-[0.18em] text-ink/55">
                  <CalendarIcon className="w-3 h-3" />
                  {new Intl.DateTimeFormat("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(`${date}T12:00:00Z`))}
                </div>
                {pendingOnDay > 0 ? (
                  <RegenDayButton planId={plan.id} date={date} />
                ) : null}
              </header>
              <ul className="space-y-2">
                {dayIdeas.map((idea) => (
                  <IdeaRow key={idea.id} idea={idea} />
                ))}
              </ul>
            </section>
          );
        })}

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
          <p className="text-[12.5px] text-ink/55">
            Tick the ideas you want. Each becomes a draft post scheduled for
            noon on its day — tune the time in the composer.
          </p>
          <button
            type="submit"
            form="plan-accept-form"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Create drafts
          </button>
        </div>
      </div>
    </div>
  );
}

function IdeaRow({ idea }: { idea: PlanIdea }) {
  const accepted = Boolean(idea.accepted);
  return (
    <li
      className={cn(
        "rounded-2xl border p-4 flex items-start gap-3",
        accepted
          ? "border-primary/40 bg-primary-soft/30"
          : "border-border-strong bg-background-elev",
      )}
    >
      <input
        type="checkbox"
        name="ideaIds"
        value={idea.id}
        form="plan-accept-form"
        disabled={accepted}
        defaultChecked={!accepted}
        className="mt-1 accent-ink"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-[0.16em] text-ink/55">
          <span>{CHANNEL_LABELS[idea.channel] ?? idea.channel}</span>
          <span aria-hidden>·</span>
          <span>{idea.format}</span>
          {accepted ? (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background tracking-wide">
              <Check className="w-3 h-3" />
              Drafted
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[14.5px] text-ink font-medium leading-[1.3]">
          {idea.title}
        </p>
        {idea.angle ? (
          <p className="mt-1 text-[13px] text-ink/70 leading-[1.55]">
            {idea.angle}
          </p>
        ) : null}
        {accepted && idea.acceptedPostId ? (
          <Link
            href={`/app/composer?post=${idea.acceptedPostId}`}
            className="mt-2 inline-flex items-center gap-1 text-[12px] text-ink/60 hover:text-ink transition-colors"
          >
            Open draft
          </Link>
        ) : null}
      </div>
    </li>
  );
}

function RegenDayButton({ planId, date }: { planId: string; date: string }) {
  return (
    <form action={regeneratePlanDayAction}>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="date" value={date} />
      <button
        type="submit"
        title="Regenerate this day's pending ideas"
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-border-strong text-[11.5px] font-medium text-ink/70 hover:text-ink hover:border-ink transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Regenerate
      </button>
    </form>
  );
}
