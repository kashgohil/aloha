"use client";

// Fan-out panel. Given source content on one channel, auto-streams native
// adaptations for each target channel in parallel and lets the user accept
// them as per-channel overrides. Same SSE shape as the variants panel; the
// difference is that the source content is fixed at open time, not typed.

import { Check, Loader2, Sparkles, Wand2, X as XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VariantPlatform } from "./variants-panel";

type State = "idle" | "streaming" | "done" | "error";

type Entry = {
  text: string;
  state: State;
  accepted?: boolean;
};

type SseEvent =
  | { platform: string; type: "start" }
  | { platform: string; type: "chunk"; text: string }
  | { platform: string; type: "done"; text: string }
  | { platform: string; type: "error"; message: string }
  | { type: "all_done" };

export function FanoutPanel({
  sourcePlatform,
  sourcePlatformName,
  sourceContent,
  targets,
  onAccept,
  onClose,
}: {
  sourcePlatform: string;
  sourcePlatformName: string;
  sourceContent: string;
  targets: VariantPlatform[];
  onAccept: (platformId: string, text: string) => void;
  onClose: () => void;
}) {
  const [variants, setVariants] = useState<Record<string, Entry>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (running) return;
    if (!sourceContent.trim() || targets.length === 0) return;

    setError(null);
    setRunning(true);
    setVariants(
      Object.fromEntries(
        targets.map((t) => [t.id, { text: "", state: "idle" as State }]),
      ),
    );

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/fanout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceContent,
          sourcePlatform,
          targetPlatforms: targets.map((t) => t.id),
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        if (res.status === 402) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "AI usage cap reached for this billing period.");
        }
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = raw.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice("data:".length).trim();
          if (!payload) continue;
          let ev: SseEvent;
          try {
            ev = JSON.parse(payload) as SseEvent;
          } catch {
            continue;
          }
          handleEvent(ev);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const msg = err instanceof Error ? err.message : "";
        setError(
          msg.startsWith("AI usage cap reached")
            ? msg
            : "Fan-out failed. Try again in a moment.",
        );
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [running, sourceContent, sourcePlatform, targets]);

  // Auto-run on open — the source content is already chosen, no point making
  // the user click "go" a second time.
  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEvent = (ev: SseEvent) => {
    if (!("platform" in ev)) return;
    setVariants((prev) => {
      const cur = prev[ev.platform] ?? { text: "", state: "idle" as State };
      if (ev.type === "start") {
        return { ...prev, [ev.platform]: { ...cur, state: "streaming", text: "" } };
      }
      if (ev.type === "chunk") {
        return {
          ...prev,
          [ev.platform]: { ...cur, state: "streaming", text: cur.text + ev.text },
        };
      }
      if (ev.type === "done") {
        return {
          ...prev,
          [ev.platform]: { ...cur, state: "done", text: ev.text },
        };
      }
      if (ev.type === "error") {
        return {
          ...prev,
          [ev.platform]: { ...cur, state: "error", text: ev.message },
        };
      }
      return prev;
    });
  };

  const handleAccept = (platformId: string) => {
    const v = variants[platformId];
    if (!v || v.state !== "done" || !v.text) return;
    onAccept(platformId, v.text);
    setVariants((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], accepted: true },
    }));
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 text-[12px] text-ink/65">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Your {sourcePlatformName} post, rewritten natively for the other
            channels. Click a card to apply it.
          </span>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          title="Regenerate"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-border-strong transition-colors shrink-0"
        >
          {running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          Regenerate
        </button>
      </div>

      <div className="px-5 py-3 border-b border-border bg-peach-100/30">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50 mb-1">
          Source · {sourcePlatformName}
        </p>
        <p className="text-[13px] text-ink/80 leading-[1.55] whitespace-pre-wrap line-clamp-3">
          {sourceContent}
        </p>
      </div>

      {error ? (
        <p className="px-5 py-3 text-[12.5px] text-red-700 bg-red-50 border-b border-red-200">
          {error}
        </p>
      ) : null}

      {targets.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-ink/55">
          Select other channels above to fan out to.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {targets.map((p) => (
            <Card
              key={p.id}
              platform={p}
              entry={variants[p.id]}
              onAccept={() => handleAccept(p.id)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function Card({
  platform,
  entry,
  onAccept,
}: {
  platform: VariantPlatform;
  entry: Entry | undefined;
  onAccept: () => void;
}) {
  const state = entry?.state ?? "idle";
  const Icon = platform.Icon;
  return (
    <li className="p-5 flex flex-col min-h-[220px]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-2 text-[13px] text-ink font-medium">
          {Icon ? <Icon className="w-4 h-4" /> : null}
          {platform.name}
        </div>
        <Chip state={state} accepted={entry?.accepted} />
      </div>
      <div className="flex-1 text-[13.5px] text-ink/85 leading-[1.55] whitespace-pre-wrap">
        {entry?.text ||
          (state === "streaming" ? (
            <span className="text-ink/40">Adapting…</span>
          ) : null)}
      </div>
      {state === "done" && !entry?.accepted ? (
        <button
          type="button"
          onClick={onAccept}
          className="mt-4 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors self-start"
        >
          Use this
        </button>
      ) : null}
      {entry?.accepted ? (
        <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-ink/60 self-start">
          <Check className="w-3.5 h-3.5 text-primary" />
          Applied to {platform.name}
        </div>
      ) : null}
    </li>
  );
}

function Chip({ state, accepted }: { state: State; accepted?: boolean }) {
  if (accepted) {
    return (
      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] tracking-wide">
        <Check className="w-3 h-3" />
        Applied
      </span>
    );
  }
  if (state === "streaming") {
    return (
      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-peach-100 text-ink/70 border border-peach-300 text-[10.5px]">
        <Loader2 className="w-3 h-3 animate-spin" />
        Adapting
      </span>
    );
  }
  if (state === "done") {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full bg-background text-ink/60 border border-border text-[10.5px]">
        Ready
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10.5px]">
        Error
      </span>
    );
  }
  return null;
}
