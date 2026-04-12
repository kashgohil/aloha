import { auth } from "@/auth";
import { db } from "@/db";
import { pages, links, subscribers, accounts } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { 
  ExternalLink, 
  Plus, 
  UserPlus, 
  Mail, 
  Tag, 
  Settings2,
  Trash2,
  Users,
  Share2,
  Globe,
  Camera,
  Layout,
  Music2,
  MessageCircle,
  ShieldCheck
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

const providers = [
  {
    id: "twitter",
    name: "X / Twitter",
    icon: Share2,
    description: "Publish tweets and threads automatically.",
    color: "text-[#1DA1F2]",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Globe,
    description: "Post updates to your professional profile.",
    color: "text-[#0A66C2]",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Camera,
    description: "Schedule posts and reels to your feed.",
    color: "text-[#E4405F]",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Layout,
    description: "Manage your page updates and posts.",
    color: "text-[#1877F2]",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music2,
    description: "Queue your short-form video content.",
    color: "text-[#000000]",
  },
  {
    id: "threads",
    name: "Threads",
    icon: MessageCircle,
    description: "Sync your text updates to the Threads network.",
    color: "text-[#000000]",
  },
  {
    id: "google",
    name: "Google",
    icon: Globe,
    description: "Used for secure authentication and identity.",
    color: "text-[#4285F4]",
  },
  {
    id: "github",
    name: "GitHub",
    icon: Globe,
    description: "Used for secure authentication and identity.",
    color: "text-[#181717]",
  },
];

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userPage = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
    with: {
      links: {
        orderBy: [asc(links.order)],
      },
    },
  }) as any;

  const userAccounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, session.user.id),
  });

  const userSubscribers = await db.query.subscribers.findMany({
    where: eq(subscribers.userId, session.user.id),
    orderBy: [desc(subscribers.createdAt)],
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Account Connectivity
          </h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
            ESTABLISH SECURE OAUTH LINKS TO YOUR DEPLOYMENT CHANNELS
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           {userPage && (
              <Link 
                href={`/u/${userPage.slug}`} 
                target="_blank"
                className="button-industrial text-[10px] font-black uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <ExternalLink className="w-4 h-4" />
                Live Page
              </Link>
           )}
           <button className="button-industrial text-[10px] font-black uppercase tracking-widest">
             <Settings2 className="w-4 h-4" />
             Global Settings
           </button>
        </div>
      </div>

      <div className="grid gap-6">
        {providers.map((provider) => {
          const isConnected = userAccounts.some((a) => a.provider === provider.id);

          return (
            <div
              key={provider.id}
              className="group border-industrial bg-background/50 backdrop-blur-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-muted transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 border-industrial flex items-center justify-center bg-background group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <provider.icon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black uppercase tracking-tight text-lg">
                      {provider.name}
                    </h3>
                    {isConnected && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 text-[8px] font-black uppercase tracking-widest border border-green-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Synced
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight max-w-sm">
                    {provider.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {isConnected ? (
                  <button className="flex-1 md:flex-none px-6 py-3 border-industrial bg-red-500/5 text-red-600 hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group/btn">
                    <Trash2 className="w-4 h-4" />
                    Disconnect
                  </button>
                ) : (
                  <button className="flex-1 md:flex-none px-6 py-3 border-industrial bg-accent text-accent-foreground hover:bg-background hover:text-foreground transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Authorize Account
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Note */}
      <div className="p-8 border-industrial border-dashed bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-tight text-xs">Security Protocol</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed max-w-2xl">
              Aloha uses AES-256 encryption to secure your access tokens. We never store your passwords and only request the minimum permissions required to execute your scheduled campaigns. Revoke access at any time via this dashboard or your platform settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
