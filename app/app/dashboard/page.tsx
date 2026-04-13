import { Smile, Users, Heart, Sparkles, ArrowUpRight, MessageCircle, Calendar as CalendarIcon, MoreHorizontal, StickyNote, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Garden Reach", value: "1.2M", change: "+12.5%", icon: Smile, color: "text-primary bg-primary/5 border-primary/10" },
  { label: "New Seedlings", value: "48.2K", change: "+3.1%", icon: Heart, color: "text-red-500 bg-red-500/5 border-red-500/10" },
  { label: "Stories Told", value: "152", change: "+24", icon: Sparkles, color: "text-secondary bg-secondary/5 border-secondary/10" },
  { label: "Meaningful Talks", value: "4.8%", change: "+0.4%", icon: MessageCircle, color: "text-accent bg-accent/5 border-accent/10" },
];

const journalEntries = [
  { id: 1, title: "A Morning Reflection on Digital Silence", platform: "Instagram", date: "MAR 12", status: "Published" },
  { id: 2, title: "The Anatomy of a Genuine Connection", platform: "LinkedIn", date: "MAR 14", status: "Draft" },
  { id: 3, title: "Why We Build in Public", platform: "Threads", date: "MAR 15", status: "Scheduled" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Editorial Header */}
      <div className="flex flex-col gap-6 relative">
        <div className="absolute -top-10 -left-10 opacity-[0.03] pointer-events-none">
           <Wind className="w-40 h-40" />
        </div>
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3">
             <div className="h-px w-12 bg-primary/30" />
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Volume IV // Issue 12</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tight ink-bleed">
            Studio <span className="text-primary italic">Overview.</span>
          </h1>
          <p className="text-xl font-medium text-muted-foreground max-w-xl italic">
            &ldquo;Every story you tell is a seed planted in the minds of your community. Tend to them with grace.&rdquo;
          </p>
        </div>
      </div>

      {/* Tactile Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              "p-8 border border-border shadow-tactile bg-background rounded-sm relative group hover:-translate-y-1 transition-all duration-500 overflow-hidden",
              i % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
            )}
          >
            {/* Background Texture Decal */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
               <stat.icon className="w-20 h-20" />
            </div>
            
            <div className="space-y-6 relative z-10">
               <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</div>
                  <ArrowUpRight className="w-4 h-4 text-primary opacity-40" />
               </div>
               <div className="space-y-1">
                  <div className="text-5xl font-display font-black tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-mono font-bold text-secondary uppercase tracking-widest">{stat.change} vs previous cycle</div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* The "Field Journal" Section */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between border-b-2 border-foreground/5 pb-6">
            <h2 className="text-4xl font-display font-black tracking-tight italic flex items-center gap-4">
              <StickyNote className="w-8 h-8 text-primary" />
              Field Journal
            </h2>
            <button className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors pb-1 border-b border-transparent hover:border-primary">
              Archive Directory
            </button>
          </div>
          
          <div className="space-y-6">
            {journalEntries.map((entry, i) => (
              <div key={entry.id} className="group relative">
                 {/* Paper Overlap Effect */}
                 <div className="absolute inset-0 bg-muted transform translate-x-1 translate-y-1 -z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm" />
                 <div className="p-8 bg-background border border-border rounded-sm transition-all flex items-center justify-between group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-sm">
                    <div className="flex items-center gap-8">
                       <div className="text-[10px] font-mono text-muted-foreground font-black tracking-tighter w-12 border-r border-border pr-4">
                          {entry.date}
                       </div>
                       <div className="space-y-1">
                          <h3 className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors">{entry.title}</h3>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{entry.platform}</span>
                             <div className="w-1 h-1 rounded-full bg-border" />
                             <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                entry.status === "Published" ? "text-secondary" : 
                                entry.status === "Scheduled" ? "text-primary" : "text-muted-foreground"
                             )}>{entry.status}</span>
                          </div>
                       </div>
                    </div>
                    <button className="p-3 hover:bg-muted rounded-full transition-colors opacity-0 group-hover:opacity-100">
                       <ArrowUpRight className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* The "Sidebar Notes" */}
        <div className="lg:col-span-4 space-y-12">
           {/* Community Note - Stitched look */}
           <div className="bg-secondary text-secondary-foreground p-10 rounded-sm shadow-tactile relative overflow-hidden group transform rotate-1">
              {/* Stitching Decal */}
              <div className="absolute top-0 left-0 w-full h-2 border-t-4 border-dashed border-background/20" />
              <div className="absolute bottom-0 left-0 w-full h-2 border-b-4 border-dashed border-background/20" />
              
              <div className="space-y-8 relative z-10">
                 <h3 className="text-3xl font-display font-black leading-tight italic">Nurture the <br /> Garden.</h3>
                 <p className="text-sm font-medium leading-relaxed opacity-90">
                    There are 12 conversations waiting for your unique perspective. Engagement is the water of the digital soil.
                 </p>
                 <button className="w-full py-5 bg-background text-foreground font-black uppercase tracking-[0.3em] text-[10px] shadow-lg hover:scale-[1.02] transition-all">
                    Initialize Reply Sync
                 </button>
              </div>
           </div>

           {/* Quick Idea - Post-it vibe */}
           <div className="bg-accent p-10 rounded-sm shadow-tactile transform rotate-[-2deg] space-y-6">
              <div className="flex items-center gap-3">
                 <Sparkles className="w-5 h-5 text-accent-foreground" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-foreground">Studio Tip</h4>
              </div>
              <p className="text-sm font-bold text-accent-foreground leading-relaxed italic">
                 &ldquo;The best time to post is when you have something meaningful to say, not when the algorithm demands it.&rdquo;
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
