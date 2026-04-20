import { AlertCircle, Building2, Heart, Sparkles, User, Users } from "lucide-react";
import { FlashToast } from "@/components/ui/flash-toast";
import { getCurrentUser } from "@/lib/current-user";
import { updateProfile } from "../actions";
import { TimezoneSelect } from "@/app/auth/onboarding/_components/timezone-select";
import { PendingSubmitButton } from "@/components/ui/pending-submit";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLES = [
  { value: "solo", label: "Solo creator", hint: "Just me", Icon: User },
  { value: "creator", label: "Creator studio", hint: "Me + helpers", Icon: Sparkles },
  { value: "team", label: "In-house team", hint: "Brand + marketing", Icon: Users },
  { value: "agency", label: "Agency", hint: "Many clients", Icon: Building2 },
  { value: "nonprofit", label: "Nonprofit", hint: "Mission-first", Icon: Heart },
] as const;

function getTimezones(): string[] {
  const supported = (
    Intl as unknown as {
      supportedValuesOf?: (key: "timeZone") => string[];
    }
  ).supportedValuesOf;
  const list = supported ? supported("timeZone") : [];
  return list.length > 0
    ? list
    : [
        "UTC",
        "America/Los_Angeles",
        "America/New_York",
        "Europe/London",
        "Europe/Paris",
        "Asia/Kolkata",
        "Asia/Tokyo",
        "Australia/Sydney",
      ];
}

export default async function ProfileSettingsPage() {
  const user = (await getCurrentUser())!;
  const zones = getTimezones();

  return (
    <div className="max-w-4xl space-y-6">
      <FlashToast
        entries={[
          {
            param: "saved",
            value: "1",
            type: "success",
            message: "Profile saved.",
          },
        ]}
      />

      <form action={updateProfile}>
        <Section
          eyebrow="You"
          title="Your name"
          body="Used in previews, emails, and the avatar menu."
        >
          <Field label="Display name">
            <input
              name="name"
              type="text"
              defaultValue={user.name ?? ""}
              placeholder="Maya Okonkwo"
              maxLength={60}
              className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
            />
          </Field>
          <Field label="Email" hint="Signed in via your identity provider.">
            <input
              type="email"
              defaultValue={user.email}
              disabled
              className="w-full h-11 px-3.5 rounded-xl bg-muted/60 border border-border text-[14px] text-ink/65"
            />
          </Field>
        </Section>

        <Section
          eyebrow="Workspace"
          title="What we call this space"
          body="Shown in the top bar and in the avatar menu."
        >
          <Field label="Workspace name">
            <input
              name="workspaceName"
              type="text"
              defaultValue={user.workspaceName ?? ""}
              placeholder="Longhand Studio"
              maxLength={60}
              className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
            />
          </Field>

          <Field label="Best describes you">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROLES.map(({ value, label, hint, Icon }) => (
                <label
                  key={value}
                  className={cn(
                    "flex items-start gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors",
                    "border-border-strong bg-background-elev hover:border-ink",
                    "has-[:checked]:border-ink has-[:checked]:bg-peach-100/50",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    defaultChecked={user.role === value}
                    className="sr-only peer"
                  />
                  <span className="mt-[2px] w-7 h-7 rounded-full bg-background border border-border grid place-items-center shrink-0 peer-checked:bg-ink peer-checked:text-background peer-checked:border-ink transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-medium text-ink">
                      {label}
                    </span>
                    <span className="block mt-0.5 text-[12px] text-ink/55">
                      {hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section
          eyebrow="Time"
          title="Scheduling defaults"
          body="Drives the calendar grouping, delivery windows, and date labels across the product."
        >
          <TimezoneSelect
            name="timezone"
            initial={user.timezone}
            zones={zones}
          />
        </Section>

        <div className="flex items-center justify-between pt-6 border-t border-border">
          <p className="text-[12px] text-ink/50 inline-flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Changes save immediately and apply everywhere.
          </p>
          <PendingSubmitButton
            className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            pendingLabel="Saving…"
          >
            Save changes
          </PendingSubmitButton>
        </div>
      </form>
    </div>
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
          <p className="mt-2 text-[12.5px] text-ink/60 leading-[1.5]">
            {body}
          </p>
        ) : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
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
    <div>
      <label className="block text-[13px] font-medium text-ink mb-2">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-2 text-[12px] text-ink/50">{hint}</p>
      ) : null}
    </div>
  );
}
