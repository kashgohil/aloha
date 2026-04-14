import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Plug } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { finishOnboarding } from "../actions";
import { ProgressRail } from "../_components/progress-rail";
import { TimezoneSelect } from "../_components/timezone-select";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Preferences — Aloha",
};

function getTimezones(): string[] {
  // Node 18+ / modern browsers support Intl.supportedValuesOf.
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
        "America/Denver",
        "America/Chicago",
        "America/New_York",
        "America/Sao_Paulo",
        "Europe/London",
        "Europe/Berlin",
        "Europe/Paris",
        "Africa/Lagos",
        "Asia/Dubai",
        "Asia/Kolkata",
        "Asia/Singapore",
        "Asia/Tokyo",
        "Australia/Sydney",
        "Pacific/Auckland",
      ];
}

export default async function PreferencesStepPage() {
  const user = (await getCurrentUser())!;

  // Step 1 must be completed before this one.
  if (!user.workspaceName || !user.role) {
    redirect(routes.onboarding.workspace);
  }

  const zones = getTimezones();

  return (
    <section className="flex-1 px-6 lg:px-10 py-12 lg:py-16">
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <ProgressRail current={2} />
          <span className="text-[11px] uppercase tracking-[0.22em] text-ink/50">
            Step 2 of 2
          </span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
          A couple of preferences
        </p>
        <h1 className="font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
          When do you
          <br />
          <span className="text-primary font-light italic">usually post?</span>
        </h1>
        <p className="mt-5 text-[15px] text-ink/70 leading-[1.55] max-w-[520px]">
          We&apos;ll use your timezone for scheduling, calendar views, and
          delivery windows. You can change it anytime from Settings.
        </p>

        <form action={finishOnboarding} className="mt-10 space-y-8">
          <TimezoneSelect
            name="timezone"
            initial={user.timezone}
            zones={zones}
          />

          <div className="rounded-2xl border border-border-strong bg-background-elev p-5 flex items-start gap-4">
            <div className="mt-[2px] w-10 h-10 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
              <Plug className="w-4 h-4 text-ink" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] text-ink font-medium">
                Connect channels when you&apos;re ready
              </p>
              <p className="mt-1 text-[13px] text-ink/65 leading-[1.55]">
                You can link Instagram, LinkedIn, X, TikTok, YouTube and more
                from Settings → Channels. No need to do it now — Aloha works
                even with no channels connected yet.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href={routes.onboarding.workspace}
              className="inline-flex items-center gap-1.5 text-[13px] text-ink/60 hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            >
              Enter workspace
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
