import { db } from "@/db";
import {
  broadcastSends,
  broadcasts,
  sendingDomains,
  subscribers,
} from "@/db/schema";
import { hasMuseInviteEntitlement } from "@/lib/billing/muse";
import { getCurrentUser } from "@/lib/current-user";
import { and, eq, sql } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle2,
  Shield,
  Users as UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BroadcastDraftEditor } from "../_components/broadcast-draft-editor";
import { SendBroadcastButton } from "../_components/send-broadcast";

export const dynamic = "force-dynamic";

export default async function BroadcastDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = (await getCurrentUser())!;

  const b = await db.query.broadcasts.findFirst({
    where: and(eq(broadcasts.id, id), eq(broadcasts.userId, user.id)),
  });
  if (!b) notFound();

  const museAccess = await hasMuseInviteEntitlement(user.id);

  const domains = await db
    .select()
    .from(sendingDomains)
    .where(eq(sendingDomains.userId, user.id));
  const verifiedDomains = domains.filter((d) => d.status === "verified");

  const [audienceCount] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${subscribers.unsubscribedAt} is null)`,
    })
    .from(subscribers)
    .where(eq(subscribers.userId, user.id));

  const isDraft = b.status === "draft";

  const selectedDomain =
    domains.find((d) => d.id === b.sendingDomainId) ?? null;
  const defaultLocalPart = b.fromAddress.includes("@")
    ? b.fromAddress.split("@")[0]
    : "hello";

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link
          href="/app/broadcasts"
          className="inline-flex items-center gap-1.5 text-[12px] text-ink/60 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Broadcasts
        </Link>
      </div>

      {isDraft ? (
        <>
          <header className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              Draft · will send to{" "}
              <span className="text-ink">{Number(audienceCount.active)}</span>{" "}
              subscribers
            </p>
            <h1 className="font-display text-[40px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
              Compose your broadcast.
            </h1>
          </header>

          <BroadcastDraftEditor
            id={b.id}
            initial={{
              subject: b.subject,
              preheader: b.preheader ?? "",
              body: b.body,
              fromName: b.fromName ?? "",
              fromLocalPart: defaultLocalPart,
              sendingDomainId: b.sendingDomainId ?? selectedDomain?.id ?? null,
              replyTo: b.replyTo ?? "",
            }}
            verifiedDomains={verifiedDomains.map((d) => ({
              id: d.id,
              domain: d.domain,
            }))}
            fallbackFromName={user.workspaceName ?? user.name ?? ""}
            museAccess={museAccess}
          />
        </>
      ) : (
        <ReadOnlyView broadcast={b} />
      )}

      {isDraft ? (
        <div className="rounded-3xl border border-border bg-background-elev p-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              Ready?
            </p>
            <p className="mt-2 text-[14px] text-ink">
              Sends to{" "}
              <span className="font-medium">
                {Number(audienceCount.active)} active subscribers
              </span>
              . Save your changes before hitting send.
            </p>
            <div className="mt-3 flex items-center gap-3 text-[12px] text-ink/55">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Unsubscribe link auto-added
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon className="w-3.5 h-3.5" />
                {Number(audienceCount.total)} total on list
              </span>
            </div>
          </div>
          <SendBroadcastButton
            id={b.id}
            disabled={
              verifiedDomains.length === 0 ||
              Number(audienceCount.active) === 0
            }
          />
        </div>
      ) : null}
    </div>
  );
}

async function ReadOnlyView({
  broadcast,
}: {
  broadcast: typeof broadcasts.$inferSelect;
}) {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      sent: sql<number>`count(*) filter (where ${broadcastSends.status} in ('sent','delivered','complained','bounced'))`,
      delivered: sql<number>`count(*) filter (where ${broadcastSends.status} = 'delivered')`,
      bounced: sql<number>`count(*) filter (where ${broadcastSends.status} = 'bounced')`,
      failed: sql<number>`count(*) filter (where ${broadcastSends.status} = 'failed')`,
      pending: sql<number>`count(*) filter (where ${broadcastSends.status} = 'pending')`,
    })
    .from(broadcastSends)
    .where(eq(broadcastSends.broadcastId, broadcast.id));

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          {broadcast.status === "sent"
            ? `Sent ${broadcast.sentAt ? new Date(broadcast.sentAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}`
            : broadcast.status === "sending"
              ? "Sending now"
              : broadcast.status === "failed"
                ? "Failed"
                : broadcast.status}
        </p>
        <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.03em] text-ink font-normal">
          {broadcast.subject}
        </h1>
        {broadcast.preheader ? (
          <p className="text-[14px] text-ink/60">{broadcast.preheader}</p>
        ) : null}
        <p className="text-[12.5px] text-ink/55">
          From {broadcast.fromName ? `${broadcast.fromName} <${broadcast.fromAddress}>` : broadcast.fromAddress}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Recipients" value={Number(stats.total)} />
        <Stat
          label={broadcast.status === "sending" ? "Pending" : "Delivered"}
          value={
            broadcast.status === "sending"
              ? Number(stats.pending)
              : Number(stats.delivered || stats.sent)
          }
        />
        <Stat label="Bounced" value={Number(stats.bounced)} />
        <Stat label="Failed" value={Number(stats.failed)} />
      </div>

      <div className="rounded-3xl border border-border bg-background-elev p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
          Message
        </p>
        <div className="font-serif text-[15.5px] leading-[1.65] text-ink whitespace-pre-wrap">
          {broadcast.body}
        </div>
      </div>

      {broadcast.status === "sent" ? (
        <p className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-deep" />
          Broadcast is done. You can't edit it — create a new one to revise.
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background-elev px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink/55">
        {label}
      </p>
      <p className="mt-1 font-display text-[28px] text-ink tabular-nums leading-none">
        {value}
      </p>
    </div>
  );
}

