"use client";

import { AtSign, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  draftBroadcastWithMuse,
  updateBroadcastDraft,
} from "@/app/actions/broadcasts";
import { DeleteBroadcastButton } from "./delete-broadcast";

export type DomainOption = {
  id: string;
  domain: string;
};

export type BroadcastDraftEditorProps = {
  id: string;
  initial: {
    subject: string;
    preheader: string;
    body: string;
    fromName: string;
    fromLocalPart: string;
    sendingDomainId: string | null;
    replyTo: string;
  };
  verifiedDomains: DomainOption[];
  fallbackFromName: string;
};

export function BroadcastDraftEditor({
  id,
  initial,
  verifiedDomains,
  fallbackFromName,
}: BroadcastDraftEditorProps) {
  const [subject, setSubject] = useState(initial.subject);
  const [preheader, setPreheader] = useState(initial.preheader);
  const [body, setBody] = useState(initial.body);
  const [fromName, setFromName] = useState(initial.fromName || fallbackFromName);
  const [fromLocalPart, setFromLocalPart] = useState(initial.fromLocalPart);
  const [sendingDomainId, setSendingDomainId] = useState(
    initial.sendingDomainId ?? verifiedDomains[0]?.id ?? "",
  );
  const [replyTo, setReplyTo] = useState(initial.replyTo);

  const [museOpen, setMuseOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [museError, setMuseError] = useState<string | null>(null);
  const [musePending, startMuse] = useTransition();

  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setSaveError(null);
    const toastId = toast.loading("Saving draft…");
    const fd = new FormData();
    fd.set("id", id);
    fd.set("subject", subject);
    fd.set("preheader", preheader);
    fd.set("body", body);
    fd.set("fromName", fromName);
    fd.set("fromLocalPart", fromLocalPart);
    fd.set("sendingDomainId", sendingDomainId);
    fd.set("replyTo", replyTo);
    try {
      await updateBroadcastDraft(fd);
      toast.success("Draft saved.", { id: toastId });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save.";
      toast.error(msg, { id: toastId });
      setSaveError(msg);
      setSaveState("error");
    }
  }

  function handleMuse() {
    setMuseError(null);
    const toastId = toast.loading("Drafting with Muse…");
    startMuse(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("brief", brief);
      try {
        const draft = await draftBroadcastWithMuse(fd);
        setSubject(draft.subject);
        setPreheader(draft.preheader);
        setBody(draft.body);
        setMuseOpen(false);
        toast.success("Draft ready.", { id: toastId });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Muse couldn't draft this.";
        toast.error(msg, { id: toastId });
        setMuseError(msg);
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Sender card */}
      <div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <AtSign className="w-4 h-4 text-ink/55" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Sender
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">
              From name
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Longhand Studio"
              className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          {verifiedDomains.length === 0 ? (
            <div className="rounded-xl border border-border-strong bg-muted/40 p-4 text-[13px] text-ink/70">
              You need a verified sending domain before you can send.{" "}
              <Link
                href="/app/audience/sending"
                className="pencil-link text-ink"
              >
                Set one up →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1.4fr] gap-2 items-end">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">
                  Local part
                </label>
                <input
                  type="text"
                  value={fromLocalPart}
                  onChange={(e) => setFromLocalPart(e.target.value)}
                  placeholder="hello"
                  className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
                />
              </div>
              <span className="text-[18px] text-ink/50 pb-3 text-center">
                @
              </span>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-2">
                  Domain
                </label>
                <select
                  value={sendingDomainId}
                  onChange={(e) => setSendingDomainId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
                >
                  {verifiedDomains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.domain}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">
              Reply-to{" "}
              <span className="text-ink/50 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="you@yourco.com"
              className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Message card */}
      <div className="rounded-3xl border border-border bg-background-elev overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-6 py-3 border-b border-border">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Message
          </p>
          <button
            type="button"
            onClick={() => setMuseOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border-strong text-[12px] font-medium text-ink hover:bg-peach-100/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Draft with Muse
          </button>
        </div>

        {museOpen ? (
          <div className="px-6 py-5 border-b border-border bg-muted/30 space-y-3">
            <label className="block text-[13px] font-medium text-ink">
              What's the email about?
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              placeholder={"A couple of sentences. The news, the point, the feeling. Muse writes in your voice — you don't have to polish it."}
              className="w-full p-3.5 rounded-xl bg-background-elev border border-border-strong text-[13.5px] leading-[1.55] text-ink focus:outline-none focus:border-ink transition-colors resize-y"
            />
            {museError ? (
              <p className="text-[12.5px] text-red-600">{museError}</p>
            ) : null}
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] text-ink/55">
                This replaces whatever's in the fields below.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMuseOpen(false)}
                  className="inline-flex items-center h-9 px-4 rounded-full text-[12.5px] text-ink/60 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMuse}
                  disabled={musePending || !brief.trim()}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink text-background text-[12.5px] font-medium hover:bg-primary disabled:opacity-40 disabled:hover:bg-ink transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {musePending ? "Drafting…" : "Draft"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="A short quiet line"
              className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">
              Preheader{" "}
              <span className="text-ink/50 font-normal">(preview text)</span>
            </label>
            <input
              type="text"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="The sentence that shows next to the subject line."
              className="w-full h-11 px-3.5 rounded-xl bg-background-elev border border-border-strong text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink mb-2">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Write like you're writing a letter.\n\nBlank lines make new paragraphs."}
              rows={14}
              className="w-full p-4 rounded-xl bg-background-elev border border-border-strong text-[14.5px] leading-[1.6] text-ink focus:outline-none focus:border-ink transition-colors resize-y font-serif"
            />
            <p className="mt-2 text-[12px] text-ink/55">
              Plain text. Blank lines become paragraphs. An unsubscribe link
              is added automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4 bg-muted/30 border-t border-border">
          <DeleteBroadcastButton id={id} subject={subject} />
          <div className="flex items-center gap-3">
            {saveError ? (
              <span className="text-[12.5px] text-red-600">{saveError}</span>
            ) : saveState === "saved" ? (
              <span className="text-[12.5px] text-ink/60">Saved</span>
            ) : null}
            <button
              type="submit"
              disabled={saveState === "saving"}
              className="inline-flex items-center h-10 px-5 rounded-full border border-border-strong text-[13.5px] font-medium text-ink hover:bg-peach-100/60 disabled:opacity-50 transition-colors"
            >
              {saveState === "saving" ? "Saving…" : "Save draft"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
