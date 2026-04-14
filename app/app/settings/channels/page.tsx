import { eq } from "drizzle-orm";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { connectChannel, disconnectChannel } from "../actions";
import {
  GoogleIcon,
  LinkedInIcon,
  GitHubIcon,
  XIcon,
} from "@/app/auth/_components/provider-icons";

export const dynamic = "force-dynamic";

type ProviderConfig = {
  id: string;
  name: string;
  purpose: string;
  Icon: React.ComponentType<{ className?: string }>;
  mono?: boolean;
  status: "available" | "soon";
};

const PROVIDERS: ProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    purpose: "Sign in with your Google account.",
    Icon: GoogleIcon,
    status: "available",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    purpose: "Sign in + publish to your profile.",
    Icon: LinkedInIcon,
    mono: true,
    status: "available",
  },
  {
    id: "twitter",
    name: "X",
    purpose: "Sign in + publish posts and threads.",
    Icon: XIcon,
    mono: true,
    status: "available",
  },
  {
    id: "github",
    name: "GitHub",
    purpose: "Sign in with your developer identity.",
    Icon: GitHubIcon,
    mono: true,
    status: "available",
  },
  {
    id: "facebook",
    name: "Facebook",
    purpose: "Publish to your page.",
    Icon: GenericMark,
    status: "available",
  },
  {
    id: "instagram",
    name: "Instagram",
    purpose: "Schedule feed posts and reels.",
    Icon: GenericMark,
    status: "available",
  },
  {
    id: "tiktok",
    name: "TikTok",
    purpose: "Queue short-form video.",
    Icon: GenericMark,
    status: "available",
  },
  {
    id: "threads",
    name: "Threads",
    purpose: "Text updates to the Threads network.",
    Icon: GenericMark,
    status: "soon",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    purpose: "Pins and idea pins.",
    Icon: GenericMark,
    status: "soon",
  },
  {
    id: "youtube",
    name: "YouTube",
    purpose: "Shorts and community posts.",
    Icon: GenericMark,
    status: "soon",
  },
];

function GenericMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  );
}

export default async function ChannelsSettingsPage() {
  const user = (await getCurrentUser())!;

  const rows = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, user.id));
  const connected = new Set(rows.map((r) => r.provider));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-[28px] leading-[1.1] tracking-[-0.02em] text-ink">
          Connected accounts
        </h2>
        <p className="mt-2 text-[13.5px] text-ink/65 leading-[1.55] max-w-2xl">
          Each channel you connect unlocks scheduling, publishing, and
          analytics for that network. You can disconnect any of them from
          here — we&apos;ll stop posting immediately, and the historical data
          stays put.
        </p>
      </div>

      <ul className="rounded-3xl border border-border bg-background-elev divide-y divide-border overflow-hidden">
        {PROVIDERS.map((p) => {
          const isConnected = connected.has(p.id);
          const isSoon = p.status === "soon";
          return (
            <li
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4"
            >
              <span
                className={cn(
                  "w-11 h-11 rounded-full border grid place-items-center shrink-0",
                  isConnected
                    ? "bg-peach-100 border-peach-300"
                    : "bg-background border-border",
                  p.mono && "text-ink",
                )}
              >
                <p.Icon className="w-[18px] h-[18px]" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14.5px] text-ink font-medium">{p.name}</p>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ink text-background text-[10.5px] font-medium tracking-wide">
                      <ShieldCheck className="w-3 h-3" />
                      Connected
                    </span>
                  ) : null}
                  {isSoon ? (
                    <span className="inline-flex items-center h-5 px-2 rounded-full border border-dashed border-border-strong text-[10.5px] text-ink/55 tracking-wide uppercase">
                      Soon
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[12.5px] text-ink/60">{p.purpose}</p>
              </div>

              <div className="shrink-0">
                {isSoon ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-dashed border-border-strong text-[13px] text-ink/45"
                  >
                    Not available yet
                  </button>
                ) : isConnected ? (
                  <form action={disconnectChannel}>
                    <input type="hidden" name="provider" value={p.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] text-ink/65 hover:text-primary-deep hover:bg-peach-100/60 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </form>
                ) : (
                  <form action={connectChannel}>
                    <input type="hidden" name="provider" value={p.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-ink text-background text-[13px] font-medium hover:bg-primary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Connect
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border border-dashed border-border-strong p-5 flex items-start gap-4">
        <span className="mt-[2px] w-9 h-9 rounded-full bg-peach-100 border border-border grid place-items-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-ink" />
        </span>
        <div>
          <p className="text-[13.5px] text-ink font-medium">
            We keep this list tight on purpose.
          </p>
          <p className="mt-1 text-[12.5px] text-ink/60 leading-[1.55] max-w-2xl">
            Aloha requests the narrowest OAuth scopes each network allows —
            enough to read and write your own posts, nothing broader. You can
            also revoke access directly in your account settings on each
            provider, and we&apos;ll fail gracefully the next time we try.
          </p>
        </div>
      </div>
    </div>
  );
}
