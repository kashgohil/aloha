import type { Metadata } from "next";
import { AlertCircle, Users, User, Building2, Heart, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { saveWorkspace } from "../actions";
import { ProgressRail } from "../_components/progress-rail";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Name your workspace — Aloha",
};

const ROLES = [
  {
    value: "solo",
    label: "Solo creator",
    hint: "Just me, building my thing",
    Icon: User,
  },
  {
    value: "creator",
    label: "Creator studio",
    hint: "Me + one or two helpers",
    Icon: Sparkles,
  },
  {
    value: "team",
    label: "In-house team",
    hint: "A brand with a marketing team",
    Icon: Users,
  },
  {
    value: "agency",
    label: "Agency",
    hint: "We post for multiple clients",
    Icon: Building2,
  },
  {
    value: "nonprofit",
    label: "Nonprofit",
    hint: "Mission over metrics",
    Icon: Heart,
  },
] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function WorkspaceStepPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const errorCode = first(params.error);
  const preservedName = first(params.name);

  const defaultName =
    preservedName ??
    user.workspaceName ??
    (user.name ? `${user.name.split(" ")[0]}'s workspace` : "");

  const defaultRole = user.role ?? undefined;

  const errors = {
    name:
      errorCode === "name"
        ? "Your workspace needs a name between 1 and 60 characters."
        : null,
    role: errorCode === "role" ? "Pick the option that best fits you." : null,
  };

  return (
    <section className="flex-1 px-6 lg:px-10 py-12 lg:py-16">
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <ProgressRail current={1} />
          <span className="text-[11px] uppercase tracking-[0.22em] text-ink/50">
            Step 1 of 2
          </span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-4">
          Let&apos;s set up your workspace
        </p>
        <h1 className="font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
          What should we
          <br />
          <span className="text-primary font-light italic">call your home?</span>
        </h1>
        <p className="mt-5 text-[15px] text-ink/70 leading-[1.55] max-w-[520px]">
          Your workspace is where your channels, schedule, and analytics live.
          You can change any of this later from Settings.
        </p>

        <form action={saveWorkspace} className="mt-10 space-y-8">
          {/* Workspace name */}
          <div>
            <label
              htmlFor="workspaceName"
              className="block text-[13px] font-medium text-ink mb-2"
            >
              Workspace name
            </label>
            <input
              id="workspaceName"
              name="workspaceName"
              type="text"
              required
              maxLength={60}
              defaultValue={defaultName}
              autoFocus
              autoComplete="off"
              placeholder="Longhand Studio"
              className={cn(
                "w-full h-12 px-4 rounded-2xl bg-background-elev border text-[15px] text-ink placeholder:text-ink/40 outline-none transition-colors focus:border-ink",
                errors.name ? "border-primary" : "border-border-strong"
              )}
            />
            {errors.name ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-primary-deep">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-ink/50">
                Usually the name of your brand, studio, or newsletter.
              </p>
            )}
          </div>

          {/* Role */}
          <fieldset>
            <legend className="block text-[13px] font-medium text-ink mb-3">
              Which best describes you?
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLES.map(({ value, label, hint, Icon }) => (
                <label
                  key={value}
                  className={cn(
                    "group relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border cursor-pointer transition-colors",
                    "border-border-strong bg-background-elev hover:border-ink",
                    "has-[:checked]:border-ink has-[:checked]:bg-peach-100/50"
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    defaultChecked={defaultRole === value}
                    required
                    className="sr-only peer"
                  />
                  <span className="mt-[2px] w-8 h-8 rounded-full bg-background border border-border grid place-items-center shrink-0 peer-checked:bg-ink peer-checked:text-background peer-checked:border-ink transition-colors">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-medium text-ink">
                      {label}
                    </span>
                    <span className="block mt-0.5 text-[12.5px] text-ink/60 leading-[1.4]">
                      {hint}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="mt-[6px] w-4 h-4 rounded-full border border-border-strong peer-checked:border-[5px] peer-checked:border-primary transition-all"
                  />
                </label>
              ))}
            </div>
            {errors.role ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-primary-deep">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.role}
              </p>
            ) : null}
          </fieldset>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[12px] text-ink/50">
              Your answers shape default channel and posting suggestions.
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
