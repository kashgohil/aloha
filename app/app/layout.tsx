"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  PenSquare,
  Users,
  Zap,
  Settings,
  LogOut,
  Bell,
  Search,
  Anchor,
  Sparkles,
  Wind
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Studio", href: "/app/dashboard" },
  { icon: Calendar, label: "Timeline", href: "/app/calendar" },
  { icon: PenSquare, label: "Composer", href: "/app/composer" },
  { icon: Users, label: "Garden", href: "/app/audience" },
  { icon: Zap, label: "Matrix", href: "/app/automations" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans bg-paper">
      {/* Handcrafted Sidebar - Like a physical folder tab */}
      <aside className="w-80 p-8 flex flex-col sticky top-0 h-screen z-20">
        <div className="bg-muted rounded-sm flex-1 flex flex-col border border-border shadow-tactile relative overflow-hidden">
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
          
          {/* Logo - Taped on vibe */}
          <div className="p-10 relative">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-foreground rounded-[30%_70%_70%_30%/30%_30%_70%_70%] flex items-center justify-center text-background shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Anchor className="w-6 h-6" />
              </div>
              <span className="font-display text-3xl font-black italic ink-bleed">Aloha.</span>
            </div>
            {/* Hand-drawn underline */}
            <div className="absolute bottom-8 left-10 w-32 h-0.5 bg-primary/30 rounded-full rotate-[-1deg]" />
          </div>

          {/* Nav */}
          <nav className="flex-1 px-6 space-y-4 relative z-10">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 px-4 mb-6">
              Studio Directory
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-sm font-black uppercase tracking-widest text-xs transition-all group relative",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1.5 h-full bg-primary rounded-r-full animate-in slide-in-from-left-full" />
                  )}
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "opacity-40")} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto text-[8px] font-mono text-primary animate-pulse">ACTIVE</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section - Taped Card vibe */}
          <div className="p-6 mt-auto">
            <div className="bg-background rounded-sm p-6 border border-border shadow-tactile transform rotate-1 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-sm bg-accent/20 flex items-center justify-center text-accent font-black border border-accent/10 transform -rotate-3">
                     K.
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-black uppercase tracking-tighter">Kashyap</span>
                     <span className="text-[8px] font-mono text-muted-foreground uppercase">CHIEF CREATIVE</span>
                  </div>
               </div>
               <div className="flex gap-3">
                  <Link href="/app/settings" className="flex-1 p-3 bg-muted rounded-sm flex items-center justify-center hover:bg-primary/10 transition-colors border border-border/50 shadow-sm">
                     <Settings className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <button className="flex-1 p-3 bg-muted rounded-sm flex items-center justify-center hover:bg-red-500/10 group transition-colors border border-border/50 shadow-sm">
                     <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-red-500" />
                  </button>
               </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 p-8">
        <div className="bg-background rounded-sm flex-1 flex flex-col border border-border shadow-2xl relative overflow-hidden">
          {/* Structural Lines Decal */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.02] bg-grid" />
          
          {/* Topbar */}
          <header className="h-24 flex items-center justify-between px-12 border-b border-border relative z-10">
            <div className="flex items-center gap-6 flex-1">
              <div className="relative max-w-md w-full group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH THE ARCHIVE..."
                  className="w-full pl-8 pr-4 py-2 bg-transparent text-[10px] font-black uppercase tracking-[0.3em] focus:outline-none transition-all placeholder:opacity-30"
                />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden lg:flex items-center gap-3 px-5 py-2 bg-muted rounded-sm border border-border/50 shadow-sm">
                 <Wind className="w-4 h-4 text-primary animate-pulse" />
                 <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Studio Vibe: Optimal</span>
              </div>
              <button className="relative group">
                <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full ring-4 ring-background" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <section className="flex-1 p-12 overflow-auto scrollbar-hide relative z-10">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </section>

          {/* Visual Decal - Corner coordinates */}
          <div className="absolute bottom-4 right-6 text-[8px] font-mono text-muted-foreground/30 uppercase tracking-[0.5em] pointer-events-none">
             LAT: 21.3069° N // LONG: 157.8583° W
          </div>
        </div>
      </main>
    </div>
  );
}
