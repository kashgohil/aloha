"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, MessageSquare, RotateCcw } from "lucide-react";
import type { PostMedia } from "@/db/schema";
import {
  addNoteByToken,
  approvePostByToken,
  requestChangesByToken,
} from "@/app/actions/external-review";
import type { SharePermissions } from "@/lib/posts/share-tokens";
import type { ExternalNote } from "../page";

type SharedPost = {
  id: string;
  content: string;
  platforms: string[];
  media: PostMedia[];
  status: string;
};

type Identity = { name: string; email: string };

const IDENTITY_KEY = (token: string) => `aloha:r:${token}:identity`;

function loadIdentity(token: string): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IDENTITY_KEY(token));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Identity;
    if (parsed?.name && parsed?.email) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveIdentity(token: string, identity: Identity) {
  try {
    window.localStorage.setItem(IDENTITY_KEY(token), JSON.stringify(identity));
  } catch {
    // localStorage can be unavailable (private mode on some browsers);
    // identity just won't persist, which means we re-prompt next visit.
  }
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ExternalReviewShell({
  token,
  permissions,
  workspaceName,
  post,
  notes,
}: {
  token: string;
  permissions: SharePermissions;
  workspaceName: string;
  post: SharedPost;
  notes: ExternalNote[];
}) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityFormName, setIdentityFormName] = useState("");
  const [identityFormEmail, setIdentityFormEmail] = useState("");
  const [comment, setComment] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [pending, startTransition] = useTransition();
  const canApprove =
    permissions === "comment_approve" &&
    (post.status === "in_review" || post.status === "approved");

  useEffect(() => {
    setIdentity(loadIdentity(token));
  }, [token]);

  const threaded = useMemo(() => {
    const byParent = new Map<string | null, ExternalNote[]>();
    for (const note of notes) {
      const bucket = byParent.get(note.parentNoteId) ?? [];
      bucket.push(note);
      byParent.set(note.parentNoteId, bucket);
    }
    return byParent.get(null) ?? [];
  }, [notes]);

  const submitIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const name = identityFormName.trim();
    const email = identityFormEmail.trim().toLowerCase();
    if (!name || !email) return;
    const next = { name, email };
    saveIdentity(token, next);
    setIdentity(next);
  };

  const handleAddComment = () => {
    if (!identity) return;
    const body = comment.trim();
    if (!body) return;
    const tid = toast.loading("Posting…");
    startTransition(async () => {
      try {
        await addNoteByToken({
          token,
          reviewerName: identity.name,
          reviewerEmail: identity.email,
          body,
        });
        toast.success("Comment posted.", { id: tid });
        setComment("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't post.", { id: tid });
      }
    });
  };

  const handleApprove = () => {
    if (!identity) return;
    const tid = toast.loading("Approving…");
    startTransition(async () => {
      try {
        await approvePostByToken({
          token,
          reviewerName: identity.name,
          reviewerEmail: identity.email,
        });
        toast.success("Approved. The team will be notified.", { id: tid });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't approve.", { id: tid });
      }
    });
  };

  const handleRequestChanges = () => {
    if (!identity) return;
    const body = requestNote.trim();
    if (!body) return;
    const tid = toast.loading("Sending…");
    startTransition(async () => {
      try {
        await requestChangesByToken({
          token,
          reviewerName: identity.name,
          reviewerEmail: identity.email,
          body,
        });
        toast.success("Changes requested.", { id: tid });
        setRequestNote("");
        setShowRequestChanges(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't send.", { id: tid });
      }
    });
  };

  if (!identity) {
    return (
      <main className="min-h-screen grid place-items-center px-6 py-16 bg-background text-ink">
        <div className="max-w-md w-full space-y-5">
          <div className="text-center space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              Aloha review
            </p>
            <h1 className="font-display text-[32px] leading-[1.1] tracking-[-0.02em]">
              {workspaceName} sent you a draft
            </h1>
            <p className="text-[13.5px] text-ink/65 leading-[1.55]">
              Tell us who you are so the team can attribute your feedback. We won&apos;t use this for anything else.
            </p>
          </div>
          <form onSubmit={submitIdentity} className="space-y-3">
            <input
              type="text"
              required
              maxLength={80}
              autoComplete="name"
              placeholder="Your name"
              value={identityFormName}
              onChange={(e) => setIdentityFormName(e.target.value)}
              className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] focus:outline-none focus:border-ink"
            />
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="Your email"
              value={identityFormEmail}
              onChange={(e) => setIdentityFormEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-full border border-border bg-background text-[14px] focus:outline-none focus:border-ink"
            />
            <button
              type="submit"
              className="w-full h-11 px-5 rounded-full bg-ink text-background text-[14px] font-medium hover:bg-primary transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-ink">
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
              Aloha review
            </p>
            <h1 className="mt-1 font-display text-[24px] leading-[1.15] tracking-[-0.02em]">
              Draft from {workspaceName}
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-border text-[11.5px] text-ink/65">
            Reviewing as {identity.name}
          </span>
        </header>

        <article className="rounded-2xl border border-border bg-background-elev p-6 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {post.platforms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center h-5 px-2 rounded-full bg-peach-100 border border-peach-300 text-[10.5px] font-medium tracking-wide text-ink"
              >
                {p}
              </span>
            ))}
          </div>
          <p className="text-[14.5px] text-ink leading-[1.6] whitespace-pre-wrap">
            {post.content}
          </p>
          {post.media.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {post.media.map((m, i) => (
                <img
                  key={i}
                  src={m.url}
                  alt={m.alt ?? ""}
                  className="w-full rounded-xl border border-border object-cover"
                />
              ))}
            </div>
          ) : null}
        </article>

        {post.status === "approved" ? (
          <div className="rounded-2xl border border-peach-300 bg-peach-100 px-5 py-4 text-[13px] text-ink">
            <Check className="inline-block w-4 h-4 mr-1.5 align-text-bottom" />
            This draft has been approved. Comments are still welcome.
          </div>
        ) : null}

        <section className="space-y-4">
          <h2 className="font-display text-[18px] tracking-[-0.01em]">
            Discussion
          </h2>
          {threaded.length === 0 ? (
            <p className="text-[13px] text-ink/55">
              No comments yet. Be the first.
            </p>
          ) : (
            <ul className="space-y-3">
              {threaded.map((note) => (
                <NoteRow key={note.id} note={note} />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Leave a comment…"
            disabled={pending}
            className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-[14px] focus:outline-none focus:border-ink resize-none"
          />
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={handleAddComment}
              disabled={pending || !comment.trim()}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border text-[13px] font-medium hover:bg-peach-100/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Add comment
            </button>
            {canApprove ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowRequestChanges((v) => !v)}
                  disabled={pending}
                  aria-pressed={showRequestChanges}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border text-[13px] font-medium hover:bg-peach-100/60 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request changes
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve
                </button>
              </>
            ) : null}
          </div>

          {canApprove && showRequestChanges ? (
            <div className="rounded-2xl border border-primary/40 bg-primary-soft/40 p-4 space-y-3">
              <p className="text-[12.5px] text-ink/70">
                What needs to change? This sends the post back to draft.
              </p>
              <textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                rows={3}
                placeholder="What needs to change…"
                disabled={pending}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-[14px] focus:outline-none focus:border-ink resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRequestChanges}
                  disabled={pending || !requestNote.trim()}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-deep transition-colors disabled:opacity-50"
                >
                  Send request
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function NoteRow({ note }: { note: ExternalNote }) {
  return (
    <li className="rounded-2xl border border-border bg-background-elev p-4 flex gap-3">
      <span className="w-8 h-8 rounded-full bg-peach-100 border border-peach-300 grid place-items-center shrink-0 text-[11px] font-semibold tracking-wide">
        {initials(note.authorName)}
      </span>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] text-ink font-medium">
            {note.authorName ?? "Anonymous"}
          </span>
          {note.authorKind === "external" ? (
            <span className="inline-flex items-center h-4 px-1.5 rounded-full bg-peach-100 border border-peach-300 text-[9.5px] tracking-wide uppercase text-ink/65">
              Client
            </span>
          ) : null}
          <span className="text-[11.5px] text-ink/50">{relativeTime(note.createdAt)}</span>
        </div>
        <p className="text-[13.5px] text-ink/85 leading-[1.55] whitespace-pre-wrap">
          {note.body}
        </p>
      </div>
    </li>
  );
}
