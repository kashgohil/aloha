import { createBroadcastDraft } from "@/app/actions/broadcasts";
import { db } from "@/db";
import { broadcasts } from "@/db/schema";
import { hasBroadcastEntitlement } from "@/lib/billing/broadcasts";
import { getCurrentUser } from "@/lib/current-user";
import { desc, eq } from "drizzle-orm";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  Pencil,
  Plus,
  Send,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BroadcastsPage() {
  const user = (await getCurrentUser())!;

  // Entitlement check and the broadcasts list both depend only on
  // user.id — fire concurrently. If not entitled the rows are discarded,
  // but the wasted work is negligible and the happy path avoids a
  // serial round-trip.
  const [entitled, rows] = await Promise.all([
    hasBroadcastEntitlement(user.id),
    db
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.userId, user.id))
      .orderBy(desc(broadcasts.createdAt)),
  ]);

  if (!entitled) {
    return <LockedState workspaceName={user.workspaceName ?? null} />;
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Broadcasts
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Write once,
            <span className="text-primary"> reach everyone.</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            One-off emails to every subscriber on your list. Pick a verified
            sending domain, write your note, hit send.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/audience/sending"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Sending domains
          </Link>
          <form action={createBroadcastDraft}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              New broadcast
            </button>
          </form>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-border bg-background-elev px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-peach-100 border border-border grid place-items-center mx-auto">
            <Mail className="w-5 h-5 text-primary-deep" />
          </div>
          <h2 className="mt-4 font-display text-[24px] text-ink">
            Nothing sent yet
          </h2>
          <p className="mt-2 text-[13.5px] text-ink/60 max-w-sm mx-auto">
            Create your first broadcast to write a note to everyone who opted
            in.
          </p>
          <form action={createBroadcastDraft} className="mt-5">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-background text-[13.5px] font-medium hover:bg-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Start a draft
            </button>
          </form>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li key={b.id}>
              <Link
                href={`/app/broadcasts/${b.id}`}
                className="block rounded-3xl border border-border bg-background-elev px-6 py-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusChip status={b.status} />
                      <span className="text-[11.5px] text-ink/55 tabular-nums">
                        {b.sentAt
                          ? `Sent ${new Date(b.sentAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                          : `Updated ${new Date(b.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-[22px] text-ink truncate">
                      {b.subject || <span className="text-ink/50">Untitled broadcast</span>}
                    </h3>
                    {b.preheader ? (
                      <p className="mt-1 text-[13px] text-ink/55 truncate">
                        {b.preheader}
                      </p>
                    ) : null}
                  </div>
                  {b.status !== "draft" ? (
                    <div className="text-right shrink-0">
                      <p className="font-display text-[20px] text-ink tabular-nums">
                        {b.deliveredCount}
                        <span className="text-ink/40">/</span>
                        {b.recipientCount}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">
                        delivered
                      </p>
                    </div>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; icon: typeof Clock; tone: string }
  > = {
    draft: {
      label: "Draft",
      icon: Pencil,
      tone: "bg-background border-border-strong text-ink/70",
    },
    sending: {
      label: "Sending",
      icon: Send,
      tone: "bg-peach-100 border-border text-ink",
    },
    sent: {
      label: "Sent",
      icon: CheckCircle2,
      tone: "bg-peach-100 border-border text-ink",
    },
    failed: {
      label: "Failed",
      icon: XCircle,
      tone: "bg-background border-border-strong text-ink/70",
    },
    scheduled: {
      label: "Scheduled",
      icon: Clock,
      tone: "bg-background border-border-strong text-ink/70",
    },
    canceled: {
      label: "Canceled",
      icon: XCircle,
      tone: "bg-background border-border-strong text-ink/70",
    },
  };
  const entry = map[status] ?? map.draft;
  const Icon = entry.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full border text-[11px] font-medium ${entry.tone}`}
    >
      <Icon className="w-3 h-3" />
      {entry.label}
    </span>
  );
}

function LockedState({ workspaceName }: { workspaceName: string | null }) {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Broadcasts
        </p>
        <h1 className="font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
          Email, the
          <span className="text-primary"> add-on.</span>
        </h1>
        <p className="text-[14px] text-ink/65 max-w-xl leading-[1.55]">
          Broadcasts go out from your own domain and actually land in
          inboxes. It's a separate add-on from Basic and Muse — each send
          carries real deliverability cost, so we price it on its own.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-background-elev px-8 py-10 max-w-2xl">
        <div className="w-12 h-12 rounded-full bg-peach-100 border border-border grid place-items-center">
          <Lock className="w-5 h-5 text-primary-deep" />
        </div>
        <h2 className="mt-5 font-display text-[26px] text-ink">
          Early access, by invite
        </h2>
        <p className="mt-3 text-[13.5px] text-ink/65 leading-[1.55]">
          We're letting a handful of people use broadcasts before the
          public plan lands. If you want in, reply to any of our emails or
          drop us a note at{" "}
          <a
            href="mailto:hey@usealoha.app"
            className="pencil-link text-ink"
          >
            hey@usealoha.app
          </a>
          .
        </p>
        <p className="mt-6 text-[12px] text-ink/50">
          Once you're on, this page turns into your broadcast composer.
        </p>
      </div>
    </div>
  );
}
