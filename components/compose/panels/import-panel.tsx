"use client";

// Source-material → fan-out panel. Three input modes feed the same
// streaming pipeline: paste a URL, paste long-form text (transcripts,
// drafts, notes), or upload a .txt / .md / .pdf. The streaming UI is
// identical across modes — only the request body differs.

import {
  Check,
  FileText,
  Globe,
  Loader2,
  Type,
  Upload,
  Wand2,
  X as XIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { VariantPlatform } from "./variants-panel";

type State = "idle" | "streaming" | "done" | "error";

type Entry = {
  text: string;
  state: State;
  accepted?: boolean;
};

type Extracted = {
  url: string;
  title: string;
  excerpt: string;
  ogImage: string | null;
};

type SseEvent =
  | {
      type: "extracted";
      url: string;
      title: string;
      excerpt: string;
      ogImage: string | null;
      content: string;
    }
  | { platform: string; type: "start" }
  | { platform: string; type: "chunk"; text: string }
  | { platform: string; type: "done"; text: string }
  | { platform: string; type: "error"; message: string }
  | { type: "all_done" }
  | { type: "fatal"; message: string };

type Mode = "url" | "text" | "file";

const TEXT_FILE_TYPES = "text/plain,text/markdown,application/pdf,.txt,.md,.pdf";
// Mirrors the server cap in /api/ai/import (50K) — front-end soft cap so
// the textarea doesn't accept obviously-too-much before round-trip.
const TEXT_SOFT_CAP = 50_000;

export function ImportPanel({
  targets,
  onAccept,
  onClose: _onClose,
}: {
  targets: VariantPlatform[];
  onAccept: (platformId: string, text: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading">("idle");
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [variants, setVariants] = useState<Record<string, Entry>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canRun =
    targets.length > 0 &&
    !running &&
    ((mode === "url" && url.trim().length > 0) ||
      (mode === "text" && pasteContent.trim().length > 0) ||
      (mode === "file" && file !== null));

  // Resolves the chosen input into the request body for /api/ai/import.
  // For file mode we side-trip through /api/upload first to get an
  // assetId; the import endpoint then re-fetches the blob server-side.
  const buildBody = useCallback(async (): Promise<Record<string, unknown>> => {
    const targetPlatforms = targets.map((t) => t.id);
    if (mode === "url") {
      return { kind: "url", url: url.trim(), targetPlatforms };
    }
    if (mode === "text") {
      return {
        kind: "text",
        title: pasteTitle.trim() || null,
        content: pasteContent,
        targetPlatforms,
      };
    }
    if (!file) throw new Error("Pick a file first.");
    setUploadStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Upload failed (${res.status})`);
      }
      const { id: assetId } = (await res.json()) as { id: string };
      return { kind: "file", assetId, targetPlatforms };
    } finally {
      setUploadStatus("idle");
    }
  }, [file, mode, pasteContent, pasteTitle, targets, url]);

  const run = useCallback(async () => {
    if (!canRun) return;

    setError(null);
    setExtracted(null);
    setRunning(true);
    setVariants(
      Object.fromEntries(
        targets.map((t) => [t.id, { text: "", state: "idle" as State }]),
      ),
    );

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const body = await buildBody();
      const res = await fetch("/api/ai/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        setError(msg || "Import failed. Try again in a moment.");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [buildBody, canRun, targets]);

  const handleEvent = (ev: SseEvent) => {
    if (ev.type === "extracted") {
      setExtracted({
        url: ev.url,
        title: ev.title,
        excerpt: ev.excerpt,
        ogImage: ev.ogImage,
      });
      return;
    }
    if (ev.type === "fatal") {
      setError(ev.message);
      return;
    }
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

  const inputHint =
    mode === "url"
      ? "Paste a URL and Muse drafts native versions for each selected channel."
      : mode === "text"
        ? "Paste a transcript, blog draft, or notes — Muse adapts it per channel."
        : "Upload a .txt, .md, or .pdf — we'll extract the text and adapt it per channel.";

  return (
    <>
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 text-[12px] text-ink/65">
        <FileText className="w-3.5 h-3.5 text-primary" />
        <span>{inputHint} Click a card to apply.</span>
      </div>

      <div className="px-5 pb-3 border-b border-border space-y-3">
        <div role="tablist" className="inline-flex rounded-full border border-border bg-background p-0.5 text-[12px]">
          <ModeTab
            active={mode === "url"}
            onClick={() => setMode("url")}
            disabled={running}
            Icon={Globe}
            label="From URL"
          />
          <ModeTab
            active={mode === "text"}
            onClick={() => setMode("text")}
            disabled={running}
            Icon={Type}
            label="Paste text"
          />
          <ModeTab
            active={mode === "file"}
            onClick={() => setMode("file")}
            disabled={running}
            Icon={Upload}
            label="Upload file"
          />
        </div>

        {mode === "url" ? (
          <div className="flex items-center gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canRun) {
                  e.preventDefault();
                  run();
                }
              }}
              placeholder="https://…"
              disabled={running}
              type="url"
              autoFocus
              className="flex-1 h-10 px-3 rounded-full border border-border bg-background text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink disabled:opacity-60"
            />
            <RunButton
              running={running}
              canRun={canRun}
              onRun={run}
              onCancel={cancel}
              hasResult={Boolean(extracted)}
            />
          </div>
        ) : null}

        {mode === "text" ? (
          <div className="space-y-2">
            <input
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Title (optional)"
              disabled={running}
              maxLength={120}
              className="w-full h-10 px-3 rounded-full border border-border bg-background text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink disabled:opacity-60"
            />
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value.slice(0, TEXT_SOFT_CAP))}
              placeholder="Paste your blog post, podcast transcript, or notes…"
              disabled={running}
              rows={8}
              className="w-full px-3 py-2.5 rounded-2xl border border-border bg-background text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink disabled:opacity-60 resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ink/45">
                {pasteContent.length.toLocaleString()} / {TEXT_SOFT_CAP.toLocaleString()} chars
              </span>
              <RunButton
                running={running}
                canRun={canRun}
                onRun={run}
                onCancel={cancel}
                hasResult={Boolean(extracted)}
              />
            </div>
          </div>
        ) : null}

        {mode === "file" ? (
          <div className="space-y-2">
            <label
              className={
                "flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-border-strong bg-background hover:border-ink transition-colors cursor-pointer disabled:opacity-60"
              }
            >
              <Upload className="w-4 h-4 text-ink/55 shrink-0" />
              <span className="flex-1 text-[13px] text-ink/75 truncate">
                {file
                  ? file.name
                  : "Choose a .txt, .md, or .pdf file"}
              </span>
              {file ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-peach-100/60"
                  aria-label="Clear file"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              ) : null}
              <input
                type="file"
                accept={TEXT_FILE_TYPES}
                disabled={running || uploadStatus === "uploading"}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                }}
                className="sr-only"
              />
            </label>
            <div className="flex items-center justify-end">
              <RunButton
                running={running}
                canRun={canRun}
                onRun={run}
                onCancel={cancel}
                hasResult={Boolean(extracted)}
                uploading={uploadStatus === "uploading"}
              />
            </div>
          </div>
        ) : null}
      </div>

      {extracted ? (
        <div className="px-5 py-3 border-b border-border bg-peach-100/30 flex items-start gap-3">
          {extracted.ogImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={extracted.ogImage}
              alt=""
              className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
            />
          ) : null}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">
              {extracted.url ? `Imported · ${hostnameOf(extracted.url)}` : "Imported"}
            </p>
            <p className="mt-1 text-[13.5px] text-ink font-medium truncate">
              {extracted.title}
            </p>
            {extracted.excerpt ? (
              <p className="mt-1 text-[12.5px] text-ink/65 leading-[1.5] line-clamp-2">
                {extracted.excerpt}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="px-5 py-3 text-[12.5px] text-red-700 bg-red-50 border-b border-red-200">
          {error}
        </p>
      ) : null}

      {targets.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-ink/55">
          Select channels above to import to.
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

function ModeTab({
  active,
  onClick,
  disabled,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-medium transition-colors",
        active
          ? "bg-ink text-background"
          : "text-ink/65 hover:text-ink",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function RunButton({
  running,
  canRun,
  onRun,
  onCancel,
  hasResult,
  uploading,
}: {
  running: boolean;
  canRun: boolean;
  onRun: () => void;
  onCancel: () => void;
  hasResult: boolean;
  uploading?: boolean;
}) {
  if (running) {
    return (
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border-strong text-[13px] font-medium text-ink hover:border-ink transition-colors"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {uploading ? "Uploading…" : "Cancel"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onRun}
      disabled={!canRun}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
    >
      <Wand2 className="w-3.5 h-3.5" />
      {hasResult ? "Re-run" : "Import & draft"}
    </button>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
            <span className="text-ink/40">Drafting…</span>
          ) : state === "idle" ? (
            <span className="text-ink/40">Waiting for source…</span>
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
