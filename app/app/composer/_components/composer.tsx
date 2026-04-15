"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Plug,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { refineContent } from "@/app/actions/ai";
import { saveDraft, schedulePost } from "@/app/actions/posts";
import { PreviewCard } from "./preview-card";

type Author = {
  name: string;
  email: string;
  image: string | null;
  workspaceName: string | null;
  timezone: string;
};

export type Platform = {
  id: string;
  name: string;
  handle: string;
  limit: number;
  accent: string;
};

const PLATFORMS: Platform[] = [
  { id: "twitter", name: "X", handle: "@handle", limit: 280, accent: "bg-ink text-background" },
  { id: "linkedin", name: "LinkedIn", handle: "in/handle", limit: 3000, accent: "bg-[#0a66c2] text-white" },
  { id: "instagram", name: "Instagram", handle: "@handle", limit: 2200, accent: "bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white" },
  { id: "facebook", name: "Facebook", handle: "/handle", limit: 5000, accent: "bg-[#1877f2] text-white" },
  { id: "tiktok", name: "TikTok", handle: "@handle", limit: 2200, accent: "bg-ink text-background" },
  { id: "threads", name: "Threads", handle: "@handle", limit: 500, accent: "bg-ink text-background" },
];

export function Composer({
  author,
  connectedProviders,
}: {
  author: Author;
  connectedProviders: string[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<string[]>(
    connectedProviders.length > 0 ? [connectedProviders[0]] : ["twitter"],
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [isRefining, startRefining] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const shortestLimit = useMemo(
    () =>
      Math.min(
        ...PLATFORMS.filter((p) => selected.includes(p.id)).map((p) => p.limit),
      ),
    [selected],
  );

  const overLimit = content.length > shortestLimit;
  const canSubmit =
    content.trim().length > 0 && selected.length > 0 && !overLimit;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const handleRefine = () => {
    if (!content.trim()) return;
    setFormError(null);
    startRefining(async () => {
      try {
        const refined = await refineContent(content, selected[0] ?? "general");
        setContent(refined);
      } catch {
        setFormError("Refine failed. Try again in a moment.");
      }
    });
  };

  const handleSaveDraft = () => {
    if (!canSubmit) return;
    setFormError(null);
    startSaving(async () => {
      try {
        await saveDraft(content, selected);
        router.push("/app/dashboard");
      } catch {
        setFormError("Couldn't save draft. Please try again.");
      }
    });
  };

  const handleSchedule = () => {
    if (!canSubmit || !scheduledAt) return;
    setFormError(null);
    startPublishing(async () => {
      try {
        await schedulePost(content, selected, new Date(scheduledAt));
        router.push("/app/dashboard");
      } catch {
        setFormError("Couldn't schedule. Check the time and try again.");
      }
    });
  };

  const handlePublishNow = () => {
    if (!canSubmit) return;
    setFormError(null);
    startPublishing(async () => {
      try {
        await schedulePost(content, selected, new Date());
        router.push("/app/dashboard");
      } catch {
        setFormError("Couldn't publish. Please try again.");
      }
    });
  };

  const displayPlatforms = PLATFORMS.filter((p) => selected.includes(p.id));

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            New post · {author.workspaceName ?? "Workspace"}
          </p>
          <h1 className="mt-3 font-display text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Compose
            <span className="text-primary font-light italic"> your next one.</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={!canSubmit || isSaving}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-border-strong transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            Save draft
          </button>

          <SchedulePopover
            scheduledAt={scheduledAt}
            setScheduledAt={setScheduledAt}
            open={showSchedule}
            setOpen={setShowSchedule}
            onConfirm={handleSchedule}
            disabled={!canSubmit || isPublishing}
            busy={isPublishing && scheduledAt !== ""}
            timezone={author.timezone}
          />

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={!canSubmit || isPublishing}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
          >
            {isPublishing && !scheduledAt ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Publish
          </button>
        </div>
      </header>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-border-strong bg-peach-100/60 px-4 py-3 text-[13.5px] text-ink"
        >
          <AlertCircle className="w-4 h-4 mt-[2px] text-primary shrink-0" />
          <span className="leading-[1.5]">{formError}</span>
        </div>
      ) : null}

      {/* Channel chips */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
          Publish to
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => {
            const isSelected = selected.includes(p.id);
            const isConnected = connectedProviders.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-[13px] font-medium transition-colors",
                  isSelected
                    ? "bg-ink text-background border-ink"
                    : "bg-background-elev text-ink/70 border-border-strong hover:border-ink hover:text-ink",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isSelected
                      ? "bg-background"
                      : isConnected
                        ? "bg-primary"
                        : "bg-ink/20",
                  )}
                />
                {p.name}
                {!isConnected ? (
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isSelected ? "text-background/60" : "text-ink/40",
                    )}
                  >
                    · preview
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {connectedProviders.length === 0 ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink/55">
            <Plug className="w-3.5 h-3.5" />
            No channels connected yet. You can still draft and schedule —
            connect from Settings to go live.
          </p>
        ) : null}
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something worth showing up for…"
              className="w-full min-h-[340px] p-7 lg:p-8 bg-transparent focus:outline-none resize-none text-[17px] leading-[1.6] text-ink placeholder:text-ink/35 font-sans"
              aria-label="Post content"
            />

            <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-border">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-ink/60 hover:text-ink hover:bg-muted/60 transition-colors"
                  aria-label="Attach image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-border mx-2" />
                <CharCounter
                  length={content.length}
                  limit={shortestLimit}
                  over={overLimit}
                  tightestPlatforms={
                    overLimit
                      ? PLATFORMS.filter(
                          (p) => selected.includes(p.id) && p.limit === shortestLimit,
                        ).map((p) => p.name)
                      : []
                  }
                />
              </div>
              <button
                type="button"
                onClick={handleRefine}
                disabled={isRefining || !content.trim()}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border-strong text-[12.5px] font-medium text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-border-strong transition-colors"
              >
                {isRefining ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                )}
                Refine
              </button>
            </div>
          </div>

          <p className="mt-4 text-[12px] text-ink/50 leading-[1.5]">
            Tip: write for the network with the shortest limit, then let the
            previews flex. Refine trims, clarifies, and re-paces without
            rewriting your voice.
          </p>
        </div>

        {/* Preview */}
        <aside className="lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55 mb-3">
            Live preview
          </p>
          {displayPlatforms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong bg-background-elev px-6 py-10 text-center text-[13px] text-ink/55">
              Pick a channel to see the preview.
            </div>
          ) : (
            <div className="space-y-4">
              {displayPlatforms.map((p) => (
                <PreviewCard
                  key={p.id}
                  platform={p}
                  author={author}
                  content={content}
                />
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function CharCounter({
  length,
  limit,
  over,
  tightestPlatforms,
}: {
  length: number;
  limit: number;
  over: boolean;
  tightestPlatforms: string[];
}) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span
        className={cn(
          "tabular-nums font-medium",
          over ? "text-primary-deep" : "text-ink/60",
        )}
      >
        {length} / {limit}
      </span>
      {over ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-deep">
          <AlertCircle className="w-3 h-3" />
          Too long for {tightestPlatforms.join(", ")}
        </span>
      ) : null}
    </div>
  );
}

function SchedulePopover({
  scheduledAt,
  setScheduledAt,
  open,
  setOpen,
  onConfirm,
  disabled,
  busy,
  timezone,
}: {
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onConfirm: () => void;
  disabled: boolean;
  busy: boolean;
  timezone: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const preview = scheduledAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(scheduledAt))
    : "Schedule";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 h-11 px-5 rounded-full border text-[14px] font-medium transition-colors",
          scheduledAt
            ? "bg-peach-100 border-ink/20 text-ink"
            : "bg-background-elev border-border-strong text-ink hover:border-ink",
        )}
      >
        <CalendarClock className="w-4 h-4" />
        {preview}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[320px] rounded-2xl border border-border-strong bg-background-elev shadow-[0_18px_48px_-24px_rgba(26,22,18,0.25)] p-5 z-50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Schedule
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60 leading-[1.5]">
            Your timezone: <span className="text-ink">{timezone}</span>
          </p>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            className="mt-4 w-full h-11 px-3.5 rounded-xl bg-background border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScheduledAt("");
                setOpen(false);
              }}
              className="flex-1 h-10 rounded-full text-[13px] text-ink/70 hover:text-ink transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={disabled || !scheduledAt}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Schedule
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
