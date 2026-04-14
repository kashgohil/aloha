import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Workspace" },
  { n: 2, label: "Preferences" },
] as const;

export function ProgressRail({ current }: { current: 1 | 2 }) {
  return (
    <ol
      className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.22em]"
      aria-label="Onboarding progress"
    >
      {STEPS.map((s, i) => {
        const isDone = s.n < current;
        const isCurrent = s.n === current;
        return (
          <li key={s.n} className="flex items-center gap-4">
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-semibold tracking-normal",
                  isDone && "bg-ink text-background border-ink",
                  isCurrent && "bg-primary text-background border-primary",
                  !isDone && !isCurrent && "bg-background border-border-strong text-ink/50"
                )}
              >
                {isDone ? "✓" : s.n}
              </span>
              <span
                className={cn(
                  isCurrent ? "text-ink" : "text-ink/45",
                  !isDone && !isCurrent && "text-ink/40"
                )}
              >
                {s.label}
              </span>
            </span>
            {i < STEPS.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "w-10 h-px",
                  isDone ? "bg-ink" : "bg-border-strong"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
