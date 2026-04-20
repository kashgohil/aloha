import { AlertCircle, CheckCircle2, Inbox, Send } from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { updateNotificationPreferences } from "../actions";
import { cn } from "@/lib/utils";
import { FlashToast } from "@/components/ui/flash-toast";

export const dynamic = "force-dynamic";

export default async function NotificationsSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [row] = await db
    .select({
      notificationsEnabled: users.notificationsEnabled,
      notifyPostOutcomes: users.notifyPostOutcomes,
      notifyInboxSyncIssues: users.notifyInboxSyncIssues,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const prefs = row ?? {
    notificationsEnabled: true,
    notifyPostOutcomes: true,
    notifyInboxSyncIssues: true,
  };

  return (
    <div className="max-w-4xl space-y-6">
      <FlashToast
        entries={[
          {
            param: "saved",
            value: "1",
            type: "success",
            message: "Notification preferences saved.",
          },
        ]}
      />

      <form action={updateNotificationPreferences}>
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

        <div className="flex items-center justify-between pt-6 border-t border-border">
          <p className="text-[12px] text-ink/50 inline-flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Changes apply to future notifications only.
          </p>
          <button
            type="submit"
            className="inline-flex items-center h-11 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
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
