"use client";

import { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import { subscribe } from "@/app/actions/audience";

export default function SubscribeForm({ userId }: { userId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const result = await subscribe({ email, userId });
      if (result.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="p-6 border-industrial border-dashed bg-accent/5 flex flex-col items-center justify-center text-center gap-2 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-12 h-12 bg-accent text-accent-foreground flex items-center justify-center">
          <Check className="w-6 h-6" />
        </div>
        <div>
          <div className="font-black uppercase tracking-tight text-sm">Access Granted</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Strategic updates will be transmitted to your terminal</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative group">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="TERMINAL EMAIL ADDRESS..."
          required
          className="w-full pl-10 pr-4 py-4 bg-background border-industrial text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-ring transition-all placeholder:opacity-30"
        />
      </div>
      <button 
        type="submit"
        disabled={status === "loading" || !email}
        className="w-full py-4 bg-foreground text-background font-black uppercase tracking-widest text-xs hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Initializing Sync...
          </>
        ) : (
          "Join Mission Control"
        )}
      </button>
      {status === "error" && (
        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest text-center italic">
          SYNC ERROR: RETRY TRANSMISSION
        </p>
      )}
    </form>
  );
}
