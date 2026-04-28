import {
  AtSign,
  CheckCircle2,
  CheckCircle,
  Inbox,
  LineChart,
  Mail,
  MessageSquare,
  Send,
  UserPlus,
} from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { cn } from "@/lib/utils";

export async function NotificationsSection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [row] = await db
    .select({
      notificationsEnabled: users.notificationsEnabled,
      notifyPostOutcomes: users.notifyPostOutcomes,
      notifyInboxSyncIssues: users.notifyInboxSyncIssues,
      notifyReviewSubmittedByEmail: users.notifyReviewSubmittedByEmail,
      notifyReviewApprovedByEmail: users.notifyReviewApprovedByEmail,
      notifyReviewAssignedByEmail: users.notifyReviewAssignedByEmail,
      notifyReviewCommentByEmail: users.notifyReviewCommentByEmail,
      notifyReviewMentionByEmail: users.notifyReviewMentionByEmail,
      notifyInsightsDigestByEmail: users.notifyInsightsDigestByEmail,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const prefs = row ?? {
    notificationsEnabled: true,
    notifyPostOutcomes: true,
    notifyInboxSyncIssues: true,
    notifyReviewSubmittedByEmail: true,
    notifyReviewApprovedByEmail: true,
    notifyReviewAssignedByEmail: true,
    notifyReviewCommentByEmail: true,
    notifyReviewMentionByEmail: true,
    notifyInsightsDigestByEmail: true,
  };

  return (
    <>
      <Section
        eyebrow="Master"
        title="In-app notifications"
        body="The bell in the top-left shows recent activity. Turn this off to silence everything."
      >
        <ToggleRow
          name="notificationsEnabled"
          label="Show notifications"
          hint="When off, no notifications are created or shown anywhere in the app."
          defaultChecked={prefs.notificationsEnabled}
          Icon={CheckCircle2}
        />
      </Section>

      <Section
        eyebrow="Categories"
        title="What you hear about"
        body="Fine-tune which events produce a notification. Only applies when the master switch is on."
      >
        <ToggleRow
          name="notifyPostOutcomes"
          label="Post outcomes"
          hint="When a scheduled post finishes — published, partial success, or failed."
          defaultChecked={prefs.notifyPostOutcomes}
          Icon={Send}
        />
        <ToggleRow
          name="notifyInboxSyncIssues"
          label="Inbox sync issues"
          hint="When a platform returns an error while pulling mentions and replies."
          defaultChecked={prefs.notifyInboxSyncIssues}
          Icon={Inbox}
        />
      </Section>

      <Section
        eyebrow="Email"
        title="Review pipeline emails"
        body="The review workflow already pings you in-app. Toggle which events also send an email — useful when you don't keep Aloha open."
      >
        <ToggleRow
          name="notifyReviewSubmittedByEmail"
          label="Drafts submitted for review"
          hint="When someone submits a post and you're a reviewer in the workspace."
          defaultChecked={prefs.notifyReviewSubmittedByEmail}
          Icon={Mail}
        />
        <ToggleRow
          name="notifyReviewApprovedByEmail"
          label="Your post is approved"
          hint="When a reviewer (internal or external via share link) approves a post you submitted."
          defaultChecked={prefs.notifyReviewApprovedByEmail}
          Icon={CheckCircle}
        />
        <ToggleRow
          name="notifyReviewAssignedByEmail"
          label="A post is assigned to you"
          hint="When a teammate routes a draft to you specifically."
          defaultChecked={prefs.notifyReviewAssignedByEmail}
          Icon={UserPlus}
        />
        <ToggleRow
          name="notifyReviewCommentByEmail"
          label="New comments on your posts"
          hint="When anyone — workspace member or external client — leaves a comment on a draft you authored or commented on."
          defaultChecked={prefs.notifyReviewCommentByEmail}
          Icon={MessageSquare}
        />
        <ToggleRow
          name="notifyReviewMentionByEmail"
          label="You're @-mentioned"
          hint="When a comment names you directly. Mentions always pre-empt the generic comment email — you'll get one or the other, never both."
          defaultChecked={prefs.notifyReviewMentionByEmail}
          Icon={AtSign}
        />
      </Section>

      <Section
        eyebrow="Weekly"
        title="Insights digest"
        body="A short Monday-morning email summarizing what worked last week, with a couple of concrete suggestions for what to do more of. Sent to workspace owners and admins."
      >
        <ToggleRow
          name="notifyInsightsDigestByEmail"
          label="Weekly Insights email"
          hint="Three best posts, why they worked, and what to do more of next week. Skips the email when there's not enough data to say anything useful."
          defaultChecked={prefs.notifyInsightsDigestByEmail}
          Icon={LineChart}
        />
      </Section>

    </>
  );
}

function ToggleRow({
  name,
  label,
  hint,
  defaultChecked,
  Icon,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked: boolean;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-colors",
        "border-border-strong bg-background-elev hover:border-ink",
        "has-[:checked]:border-ink has-[:checked]:bg-peach-100/50",
      )}
    >
      <span className="mt-[2px] w-8 h-8 rounded-full bg-background border border-border grid place-items-center shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        {hint ? (
          <span className="block mt-0.5 text-[12px] text-ink/55">{hint}</span>
        ) : null}
      </span>
      <span className="relative mt-1 inline-flex h-5 w-9 items-center shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-muted peer-checked:bg-ink transition-colors" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

function Section({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 py-8 border-b border-border last:border-b-0">
      <div className="md:pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-display text-[22px] leading-[1.1] tracking-[-0.015em] text-ink">
          {title}
        </h2>
        {body ? (
          <p className="mt-2 text-[12.5px] text-ink/60 leading-[1.5]">{body}</p>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
