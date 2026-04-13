import { auth } from "@/auth";
import { db } from "@/db";
import { pages, links, subscribers } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  ExternalLink, 
  Plus, 
  UserPlus, 
  Mail, 
  Tag, 
  Settings2,
  Trash2,
  Users
} from "lucide-react";
import Link from "next/link";

export default async function AudiencePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userPage = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
    with: {
      links: {
        orderBy: [asc(links.order)],
      },
    },
  }) as any; // Using any for the quick prototype build to avoid Drizzle query type complexities

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
            Audience Control
          </h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
            MANAGEMENT OF PUBLIC PROFILE AND SUBSCRIBER INFRASTRUCTURE
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Engine */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-2 bg-accent" />
             <h2 className="font-black uppercase tracking-tight text-sm uppercase italic">Profile Engine</h2>
          </div>

          <div className="border-industrial bg-background p-8 space-y-8">
             {/* General Config */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unique Slug</label>
                   <div className="flex">
                      <div className="px-3 py-2 bg-muted border-industrial border-r-0 text-xs font-mono text-muted-foreground select-none">aloha.com/u/</div>
                      <input 
                        type="text" 
                        defaultValue={userPage?.slug || ""} 
                        placeholder="your-handle"
                        className="flex-1 bg-background border-industrial px-3 py-2 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</label>
                   <input 
                     type="text" 
                     defaultValue={userPage?.title || ""} 
                     placeholder="Mission Control"
                     className="w-full bg-background border-industrial px-3 py-2 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-ring"
                   />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transmission Bio</label>
                <textarea 
                  defaultValue={userPage?.bio || ""} 
                  placeholder="The primary communication channel for strategic updates..."
                  className="w-full h-24 bg-background border-industrial p-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
             </div>

             {/* Links Management */}
             <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-industrial pb-2">
                   <h3 className="text-[10px] font-black uppercase tracking-widest">Active Redirects</h3>
                   <button className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Add Link
                   </button>
                </div>
                
                <div className="space-y-2">
                   {userPage?.links.length ? userPage.links.map((link: any) => (
                      <div key={link.id} className="p-3 border-industrial bg-muted/20 flex items-center justify-between group hover:bg-muted/40 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-background border-industrial flex items-center justify-center font-mono text-[10px] font-bold">
                               {link.order}
                            </div>
                            <div>
                               <div className="text-[10px] font-black uppercase tracking-tight">{link.title}</div>
                               <div className="text-[8px] font-mono text-muted-foreground truncate max-w-[200px]">{link.url}</div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:bg-muted text-muted-foreground transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                            <button className="p-1 hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </div>
                   )) : (
                      <div className="py-8 border-industrial border-dashed text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">No links established</p>
                      </div>
                   )}
                </div>
             </div>

             <button className="w-full py-4 bg-accent text-accent-foreground font-black uppercase tracking-widest text-xs hover:bg-accent/90 transition-all">
                Update Profile Configuration
             </button>
          </div>
        </div>

        {/* Subscriber CRM */}
        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-accent" />
              <h2 className="font-black uppercase tracking-tight text-sm uppercase italic text-muted-foreground">Subscriber CRM</h2>
           </div>

           <div className="space-y-4">
              {/* Stats Card */}
              <div className="p-6 border-industrial bg-accent text-accent-foreground relative overflow-hidden">
                 <Users className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
                 <div className="relative z-10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Acquisition</div>
                    <div className="text-4xl font-black tracking-tighter">{userSubscribers.length.toString().padStart(2, '0')}</div>
                    <div className="flex items-center gap-2 mt-4 text-[10px] font-mono">
                       <span className="bg-green-500 text-white px-1.5 py-0.5 font-bold">+03</span>
                       <span className="opacity-70">SINCE PREVIOUS CYCLE</span>
                    </div>
                 </div>
              </div>

              {/* Subscriber List */}
              <div className="border-industrial bg-background">
                 <div className="p-4 border-b border-industrial flex items-center justify-between bg-muted/30">
                    <span className="text-[10px] font-black uppercase tracking-widest">Lead List</span>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                 </div>
                 
                 <div className="divide-y divide-industrial max-h-[400px] overflow-auto">
                    {userSubscribers.length ? userSubscribers.map((sub) => (
                       <div key={sub.id} className="p-4 hover:bg-muted transition-colors group">
                          <div className="flex items-center justify-between">
                             <div>
                                <div className="text-[11px] font-black uppercase tracking-tight">{sub.email}</div>
                                <div className="text-[9px] font-mono text-muted-foreground mt-0.5 flex items-center gap-2">
                                   <ClockIcon className="w-3 h-3" />
                                   {new Date(sub.createdAt).toLocaleDateString()}
                                </div>
                             </div>
                             <div className="flex gap-1">
                                {sub.tags?.map(tag => (
                                   <span key={tag} className="px-1.5 py-0.5 bg-muted border-industrial text-[8px] font-black uppercase tracking-widest">{tag}</span>
                                ))}
                             </div>
                          </div>
                       </div>
                    )) : (
                       <div className="p-8 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">List is currently vacant</p>
                       </div>
                    )}
                 </div>

                 <div className="p-4 border-t border-industrial bg-muted/10">
                    <button className="w-full py-2 border-industrial text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors flex items-center justify-center gap-2">
                       <UserPlus className="w-4 h-4" />
                       Export Strategic Data
                    </button>
                 </div>
              </div>

              {/* Quick Tags */}
              <div className="p-4 border-industrial border-dashed space-y-3">
                 <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3 h-3" />
                    Segment Matrix
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {["Beta", "Lead", "VIP", "Strategic"].map(tag => (
                       <span key={tag} className="px-2 py-1 bg-background border-industrial text-[8px] font-mono font-bold uppercase cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all">
                          {tag}
                       </span>
                    ))}
                 </div>
              </div>
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
