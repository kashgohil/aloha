"use client";

import { useEffect, useState } from "react";
import { listSubredditFlairs, type RedditFlair } from "@/app/actions/reddit";

// Shared subreddit + flair + nsfw/spoiler row used by every Reddit form.
// Flairs are fetched on-demand when the subreddit changes; failures fall
// back to a "no flair" state silently.
export type RedditPostingMeta = {
  subreddit: string;
  flairId: string;
  flairText: string;
  nsfw: boolean;
  spoiler: boolean;
};

export function readRedditMeta(payload: Record<string, unknown>): RedditPostingMeta {
  return {
    subreddit: typeof payload.subreddit === "string" ? payload.subreddit : "",
    flairId: typeof payload.flairId === "string" ? payload.flairId : "",
    flairText: typeof payload.flairText === "string" ? payload.flairText : "",
    nsfw: payload.nsfw === true,
    spoiler: payload.spoiler === true,
  };
}

export function RedditFields({
  meta,
  onChange,
  disabled,
}: {
  meta: RedditPostingMeta;
  onChange: (next: Partial<RedditPostingMeta>) => void;
  disabled?: boolean;
}) {
  const [flairs, setFlairs] = useState<RedditFlair[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!meta.subreddit.trim()) {
      setFlairs([]);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      const list = await listSubredditFlairs(meta.subreddit.trim());
      if (!cancelled) {
        setFlairs(list);
        setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [meta.subreddit]);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Subreddit
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
          <span className="text-[13px] text-ink/55">r/</span>
          <input
            type="text"
            value={meta.subreddit}
            onChange={(e) =>
              onChange({
                subreddit: e.target.value.replace(/^r\//, "").trim(),
                flairId: "",
                flairText: "",
              })
            }
            disabled={disabled}
            className="flex-1 bg-transparent py-2 text-[14px] text-ink focus:outline-none disabled:opacity-60"
            placeholder="aww"
          />
        </div>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          Flair {loading ? "(loading…)" : null}
        </span>
        {flairs.length > 0 ? (
          <select
            value={meta.flairId}
            onChange={(e) => {
              const id = e.target.value;
              const found = flairs.find((f) => f.id === id);
              onChange({
                flairId: id,
                flairText: found?.text ?? "",
              });
            }}
            disabled={disabled}
            className="rounded-xl border border-border bg-background px-3 py-2 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-60"
          >
            <option value="">No flair</option>
            {flairs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.text}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-[12px] text-ink/55">
            {meta.subreddit.trim()
              ? "No flairs available for this subreddit."
              : "Enter a subreddit to load flairs."}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={meta.nsfw}
            onChange={(e) => onChange({ nsfw: e.target.checked })}
            disabled={disabled}
            className="rounded border-border disabled:opacity-60"
          />
          <span className="text-[13px] text-ink">NSFW</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={meta.spoiler}
            onChange={(e) => onChange({ spoiler: e.target.checked })}
            disabled={disabled}
            className="rounded border-border disabled:opacity-60"
          />
          <span className="text-[13px] text-ink">Spoiler</span>
        </label>
      </div>
    </div>
  );
}
