"use client";

import { Copy, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createShareLink,
  listShareLinks,
  revokeShareLink,
  type ShareLinkRow,
} from "@/app/actions/post-share";
import type { SharePermissions } from "@/lib/posts/share-tokens";

const baseBtn =
  "inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-medium transition-colors disabled:opacity-40";
const ghostBtn = `${baseBtn} border border-border bg-background text-ink hover:border-ink/40`;

const TTL_OPTIONS = [
  { days: 1, label: "1 day" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
] as const;

function fmtDate(d: Date | null) {
  if (!d) return "no expiry";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function statusLabel(row: ShareLinkRow): { label: string; tone: "live" | "expired" | "revoked" } {
  if (row.revokedAt) return { label: "Revoked", tone: "revoked" };
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { label: "Expired", tone: "expired" };
  }
  return { label: `Expires ${fmtDate(row.expiresAt)}`, tone: "live" };
}

export function ShareLinkButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ShareLinkRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [ttl, setTtl] = useState<number>(7);
  const [perm, setPerm] = useState<SharePermissions>("comment_approve");
  const [pending, startTransition] = useTransition();

  // Lazy-load on first open. Avoids the n+1 fetch on every post detail
  // page render — most posts never get shared and shouldn't pay for it.
  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    listShareLinks(postId)
      .then((next) => {
        if (!cancelled) {
          setRows(next);
          setLoaded(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Couldn't load share links.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, loaded, postId]);

  const handleCreate = () => {
    const tid = toast.loading("Creating link…");
    startTransition(async () => {
      try {
        const created = await createShareLink(postId, {
          expiresInDays: ttl,
          permissions: perm,
        });
        try {
          await navigator.clipboard.writeText(created.url);
          toast.success("Link created and copied.", { id: tid });
        } catch {
          toast.success("Link created.", { id: tid });
        }
        // Refresh list — cheaper than re-querying since we mutate locally.
        const next = await listShareLinks(postId);
        setRows(next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't create link.", {
          id: tid,
        });
      }
    });
  };

  const handleRevoke = (id: string) => {
    const tid = toast.loading("Revoking…");
    startTransition(async () => {
      try {
        await revokeShareLink(id);
        toast.success("Link revoked.", { id: tid });
        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, revokedAt: new Date() } : r,
          ),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't revoke.", {
          id: tid,
        });
      }
    });
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied.");
    } catch {
      toast.error("Couldn't copy. Select and copy manually.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={ghostBtn} disabled={pending}>
        <Link2 className="w-3.5 h-3.5" />
        Share for review
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] max-h-[480px] overflow-y-auto"
      >
        <div className="space-y-4">
          <div>
            <p className="text-[13px] text-ink font-medium">
              Share with someone outside the workspace
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink/60 leading-[1.5]">
              They can comment, and optionally approve or request changes — without an Aloha seat.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                disabled={pending}
                className="flex-1 h-9 px-3 rounded-full border border-border bg-background text-[12.5px] focus:outline-none focus:border-ink"
              >
                {TTL_OPTIONS.map((o) => (
                  <option key={o.days} value={o.days}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={perm}
                onChange={(e) => setPerm(e.target.value as SharePermissions)}
                disabled={pending}
                className="flex-1 h-9 px-3 rounded-full border border-border bg-background text-[12.5px] focus:outline-none focus:border-ink"
              >
                <option value="comment_approve">Comment + approve</option>
                <option value="comment_only">Comment only</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary transition-colors disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Create link
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/55">
              Existing links
            </p>
            {!loaded ? (
              <p className="text-[12px] text-ink/55">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-[12px] text-ink/55">No links yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {rows.map((row) => {
                  const status = statusLabel(row);
                  const dead = status.tone !== "live";
                  return (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border bg-background px-3 py-2 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 min-w-0 text-[11px] text-ink/70 truncate"
                          title={row.url}
                        >
                          {row.url}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(row.url)}
                          disabled={dead}
                          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-peach-100/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Copy link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {!dead ? (
                          <button
                            type="button"
                            onClick={() => handleRevoke(row.id)}
                            disabled={pending}
                            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-ink/65 hover:text-ink hover:bg-peach-100/60 transition-colors"
                            aria-label="Revoke link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-ink/55">
                        <span>
                          {row.permissions === "comment_approve"
                            ? "Comment + approve"
                            : "Comment only"}
                        </span>
                        <span aria-hidden>·</span>
                        <span
                          className={
                            status.tone === "live" ? "text-ink/65" : "text-ink/40"
                          }
                        >
                          {status.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
