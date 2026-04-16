"use client";

import { useTransition, useState } from "react";
import { sendReply } from "@/app/actions/inbox";
import { Send } from "lucide-react";

export function InboxReplyForm({ messageId }: { messageId: string }) {
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || pending) return;

    startTransition(async () => {
      await sendReply(messageId, content.trim());
      setContent("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        className="flex-1 resize-none rounded-xl bg-background-elev border border-border-strong px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink transition-colors"
      />
      <button
        type="submit"
        disabled={!content.trim() || pending}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-ink text-background disabled:opacity-40 hover:bg-primary transition-colors shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
