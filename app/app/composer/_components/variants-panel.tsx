"use client";

// Per-channel variant picker. Given a topic and the current set of selected
// platforms, POSTs to /api/ai/variants, reads the SSE stream, and streams
// one variant card per platform in parallel. User clicks a card to accept
// it as that platform's override.

import { Check, Loader2, Wand2, X as XIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export type VariantPlatform = {
  id: string;
  name: string;
  Icon?: React.ComponentType<{ className?: string }>;
};

type State = "idle" | "streaming" | "done" | "error";

type VariantEntry = {
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

export function VariantsPanel({
  platforms,
  onAccept,
  onClose,
}: {
  platforms: VariantPlatform[];
  onAccept: (platformId: string, text: string) => void;
  onClose: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [variants, setVariants] = useState<Record<string, VariantEntry>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    const t = topic.trim();
    if (!t || platforms.length === 0 || running) return;

    setError(null);
    setRunning(true);
    setVariants(
      Object.fromEntries(
        platforms.map((p) => [p.id, { text: "", state: "idle" as State }]),
      ),
    );

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: t,
          platforms: platforms.map((p) => p.id),
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
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
        setError("Generation failed. Try again in a moment.");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [platforms, running, topic]);

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

  const cancel = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  return (
    <div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
      <header className="px-5 py-4 border-b border-border flex items-start gap-3">
        <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0">
          <Wand2 className="w-4 h-4 text-ink" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] text-ink font-medium">
            One topic · {platforms.length} native version
            {platforms.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.55]">
            Drafts stream in side-by-side. Click a card to use it as that
            channel&apos;s version. Re-run to get different takes.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close variants"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-ink/50 hover:text-ink hover:bg-muted/50 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </header>

      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !running) {
              e.preventDefault();
              run();
            }
          }}
          placeholder="Topic or brief — e.g. lessons from ten failed launches"
          disabled={running}
          autoFocus
          className="flex-1 h-10 px-3 rounded-full border border-border bg-background text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink disabled:opacity-60"
        />
        {running ? (
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] font-medium text-ink hover:border-ink transition-colors"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            disabled={!topic.trim() || platforms.length === 0}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {Object.keys(variants).length > 0 ? "Regenerate" : "Write variants"}
          </button>
        )}
      </div>

      {error ? (
        <p className="px-5 py-3 text-[12.5px] text-red-700 bg-red-50 border-b border-red-200">
          {error}
        </p>
      ) : null}

      {platforms.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-ink/55">
          Select at least one channel above to generate variants.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {platforms.map((p) => {
            const v = variants[p.id];
            return (
              <VariantCard
                key={p.id}
                platform={p}
                entry={v}
                onAccept={() => handleAccept(p.id)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

function VariantCard({
  platform,
  entry,
  onAccept,
}: {
  platform: VariantPlatform;
  entry: VariantEntry | undefined;
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
        <VariantChip state={state} accepted={entry?.accepted} />
      </div>
      <div className="flex-1 text-[13.5px] text-ink/85 leading-[1.55] whitespace-pre-wrap">
        {entry?.text ||
          (state === "idle" ? (
            <span className="text-ink/40">Waiting for topic…</span>
          ) : state === "streaming" ? (
            <span className="text-ink/40">Drafting…</span>
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

function VariantChip({
  state,
  accepted,
}: {
  state: State;
  accepted?: boolean;
}) {
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
        Drafting
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

