import { auth } from "@/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Globe, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // Fetch all posts for the user to display on the calendar
  // In a real app, we'd filter by month/year based on URL params
  const userPosts = await db.query.posts.findMany({
    where: eq(posts.userId, session.user.id),
    orderBy: (posts, { asc }) => [asc(posts.scheduledAt)],
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Basic calendar logic for current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthName = now.toLocaleString('default', { month: 'long' }).toUpperCase();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Deployment Timeline
          </h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
            VISUALIZING CONTENT STRATEGY // {monthName} {currentYear}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="button-industrial p-2">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-6 py-2 border-industrial font-black text-[10px] uppercase tracking-widest bg-muted/50">
            {monthName}
          </div>
          <button className="button-industrial p-2">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border-industrial bg-background">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-industrial bg-muted/30">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center border-r border-industrial last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {emptyDays.map(i => (
            <div key={`empty-${i}`} className="min-h-[140px] border-r border-b border-industrial bg-muted/10 last:border-r-0" />
          ))}
          
          {days.map(day => {
            const dateStr = new Date(currentYear, currentMonth, day).toDateString();
            const postsOnDay = userPosts.filter(p => p.scheduledAt && new Date(p.scheduledAt).toDateString() === dateStr);
            const isToday = day === now.getDate() && currentMonth === now.getMonth();

            return (
              <div 
                key={day} 
                className={cn(
                  "min-h-[140px] border-r border-b border-industrial p-2 space-y-2 group transition-colors last:border-r-0 hover:bg-muted/5",
                  isToday && "bg-accent/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "font-mono text-[10px] font-bold px-1.5 py-0.5",
                    isToday ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}>
                    {day.toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="space-y-1">
                  {postsOnDay.map(post => (
                    <div 
                      key={post.id}
                      className={cn(
                        "p-1.5 border-industrial text-[9px] font-bold uppercase tracking-tight flex flex-col gap-1 transition-all hover:scale-[1.02] cursor-pointer",
                        post.status === "published" ? "bg-green-500/10 text-green-700 border-green-500/20" :
                        post.status === "failed" ? "bg-red-500/10 text-red-700 border-red-500/20" :
                        "bg-background hover:border-accent"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate flex-1">{post.content}</span>
                        <div className="flex gap-0.5 shrink-0">
                          {post.platforms.includes("twitter") && <Share2 className="w-2.5 h-2.5" />}
                          {post.platforms.includes("linkedin") && <Globe className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-60 font-mono text-[8px]">
                        {post.status === "published" ? <CheckCircle2 className="w-2 h-2" /> :
                         post.status === "failed" ? <AlertCircle className="w-2 h-2" /> :
                         <Clock className="w-2 h-2" />}
                        {post.scheduledAt && new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 border-industrial border-dashed p-6 bg-muted/20">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="w-3 h-3 border-industrial bg-background" />
          Scheduled
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="w-3 h-3 border-industrial bg-green-500/20" />
          Published
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="w-3 h-3 border-industrial bg-red-500/20" />
          Failed
        </div>
      </div>
    </div>
  );
}
