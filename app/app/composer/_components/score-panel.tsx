"use client";

// Pre-publish score panel. Auto-runs on open for the current content on the
// chosen channel (either the active channel tab or — for "all channels" —
// the first selected platform). Shows score + one-liner + strengths +
// weaknesses and an "Apply improvement" button that runs the improvement
// brief through the refine pipeline and swaps the editor in place.

import {
  CheckCircle2,
  Gauge,
  Loader2,
  Sparkles,
  TriangleAlert,
  X as XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { improveWithBrief, scorePost, type PostScore } from "@/app/actions/ai";
import { cn } from "@/lib/utils";

type State = "loading" | "ready" | "error";

export function ScorePanel({
  platformId,
  platformName,
  content,
  onImprove,
  onClose,
}: {
  platformId: string;
  platformName: string;
  content: string;
  // Called when the user accepts an improvement. Caller writes the new
  // content into its editor state.
  onImprove: (text: string) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<State>("loading");
  const [result, setResult] = useState<PostScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const lastScoredKey = useRef<string | null>(null);

  const run = useCallback(async () => {
    setState("loading");
    setError(null);
    setResult(null);
    try {
      const res = await scorePost(content, platformId);
      setResult(res);
      setState("ready");
      lastScoredKey.current = `${platformId}::${content}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scoring failed.";
      setError(msg);
      setState("error");
    }
  }, [content, platformId]);

  useEffect(() => {
    // Avoid re-scoring the same content when the panel re-mounts at the same
    // cursor state (e.g., a parent re-render). The key captures both.
    const key = `${platformId}::${content}`;
    if (lastScoredKey.current === key && state !== "loading") return;
    run();
  }, [content, platformId, run, state]);

  const handleImprove = async () => {
    if (!result?.improvementBrief) return;
    setImproving(true);
    setError(null);
    try {
      const text = await improveWithBrief(
        content,
        platformId,
        result.improvementBrief,
      );
      onImprove(text);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't apply the improvement.");
    } finally {
      setImproving(false);
    }
  };

  const scoreBand = result ? bandFor(result.score) : null;

  return (
    <>
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 text-[12px] text-ink/65">
        <Gauge className="w-3.5 h-3.5 text-primary" />
        <span>
          Pre-publish check for {platformName} — what lands, what
          doesn&apos;t, and a one-click fix for the weak spots.
        </span>
      </div>

      {state === "loading" ? (
        <div className="px-5 py-10 flex items-center justify-center text-[13px] text-ink/55">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Reading your draft…
        </div>
      ) : null}

      {state === "error" ? (
        <div className="px-5 py-6 flex items-start gap-3">
          <TriangleAlert className="w-4 h-4 text-red-700 mt-[2px]" />
          <div className="flex-1">
            <p className="text-[13px] text-red-700">{error}</p>
            <button
              type="button"
              onClick={run}
              className="mt-2 inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:border-ink transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {state === "ready" && result && scoreBand ? (
        <>
          <div className="px-5 py-5 border-b border-border grid grid-cols-[auto,1fr] gap-5">
            <div
              className={cn(
                "grid place-items-center w-24 h-24 rounded-full border text-center font-display tabular-nums",
                scoreBand.className,
              )}
            >
              <div>
                <p className="text-[34px] leading-none">{result.score}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] mt-1 opacity-70">
                  {scoreBand.label}
                </p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] text-ink font-medium leading-[1.4]">
                {result.oneLine || "Reviewed."}
              </p>
              {result.improvementBrief ? (
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={improving}
                  className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
                >
                  {improving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Apply improvement
                </button>
              ) : null}
            </div>
          </div>

          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5 text-[13px]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50 mb-2 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                Strengths
              </p>
              {result.strengths.length === 0 ? (
                <p className="text-ink/50">—</p>
              ) : (
                <ul className="space-y-1.5 text-ink/80">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span aria-hidden className="text-primary mt-[6px] text-[8px]">
                        ●
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50 mb-2 inline-flex items-center gap-1.5">
                <TriangleAlert className="w-3 h-3 text-primary-deep" />
                Weak spots
              </p>
              {result.weaknesses.length === 0 ? (
                <p className="text-ink/50">—</p>
              ) : (
                <ul className="space-y-1.5 text-ink/80">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span aria-hidden className="text-primary-deep mt-[6px] text-[8px]">
                        ●
                      </span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function bandFor(score: number): { label: string; className: string } {
  if (score >= 85) {
    return {
      label: "Excellent",
      className: "bg-ink text-background border-ink",
    };
  }
  if (score >= 70) {
    return {
      label: "Solid",
      className: "bg-peach-200 text-ink border-peach-300",
    };
  }
  if (score >= 50) {
    return {
      label: "Workable",
      className: "bg-peach-100 text-ink border-peach-300",
    };
  }
  if (score >= 30) {
    return {
      label: "Rewrite",
      className: "bg-primary-soft text-primary-deep border-primary/40",
    };
  }
  return {
    label: "Issue",
    className: "bg-red-50 text-red-700 border-red-200",
  };
}
