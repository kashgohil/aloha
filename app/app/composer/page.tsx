"use client";

import { useState } from "react";
import { 
  Share2, 
  Globe, 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  Calendar,
  ChevronRight,
  Info,
  Loader2,
  Camera,
  Layout,
  Music2,
  MessageCircle,
  Flower2,
  PenTool
} from "lucide-react";
import { cn } from "@/lib/utils";
import { refineContent } from "@/app/actions/ai";
import { saveDraft, schedulePost } from "@/app/actions/posts";
import { useRouter } from "next/navigation";

const PLATFORMS = [
  { id: "twitter", name: "X", icon: Share2, limit: 280 },
  { id: "linkedin", name: "LinkedIn", icon: Globe, limit: 3000 },
  { id: "instagram", name: "Instagram", icon: Camera, limit: 2200 },
  { id: "facebook", name: "Facebook", icon: Layout, limit: 5000 },
  { id: "tiktok", name: "TikTok", icon: Music2, limit: 2200 },
  { id: "threads", name: "Threads", icon: MessageCircle, limit: 500 },
];

export default function ComposerPage() {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter"]);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [showScheduler, setShowScheduler] = useState(false);
  const router = useRouter();

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleRefine = async () => {
    if (!content) return;
    setIsRefining(true);
    try {
      const platform = selectedPlatforms[0] || "general";
      const refined = await refineContent(content, platform);
      setContent(refined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content) return;
    setIsSaving(true);
    try {
      await saveDraft(content, selectedPlatforms);
      router.push("/app/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!content || !scheduledAt) return;
    setIsScheduling(true);
    try {
      await schedulePost(content, selectedPlatforms, new Date(scheduledAt));
      router.push("/app/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsScheduling(false);
      setShowScheduler(false);
    }
  };

  const minLimit = Math.min(
    ...PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(p => p.limit)
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-bold tracking-tight flex items-center gap-3">
            <PenTool className="w-8 h-8 text-primary" />
            Share your story
          </h1>
          <p className="text-muted-foreground font-medium">What's on your mind today?</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowScheduler(!showScheduler)}
              className={cn(
                "px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 border border-border shadow-soft hover:bg-muted/50",
                showScheduler && "bg-muted border-primary/30"
              )}
            >
              <Calendar className="w-4 h-4 text-primary" />
              {scheduledAt ? new Date(scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Schedule"}
            </button>
            
            {showScheduler && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-background border border-border rounded-[2rem] p-6 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <div className="space-y-5">
                  <div className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Flower2 className="w-3 h-3" />
                    Set a time to bloom
                  </div>
                  <input 
                    type="datetime-local" 
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowScheduler(false)}
                      className="flex-1 px-4 py-3 bg-muted rounded-xl text-xs font-bold transition-colors hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSchedule}
                      disabled={!scheduledAt || isScheduling}
                      className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isScheduling && <Loader2 className="w-3 h-3 animate-spin" />}
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSaveDraft}
            disabled={isSaving || !content}
            className="px-6 py-3 bg-muted rounded-full font-bold text-sm hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : "Save Draft"}
          </button>
          
          <button className="button-primary px-10">
            <Send className="w-4 h-4" />
            Post Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Editor Area */}
        <div className="lg:col-span-7 space-y-8">
          {/* Platform Selectors */}
          <div className="flex flex-wrap gap-3">
            {PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-full flex items-center gap-2.5 transition-all font-bold text-xs border shadow-soft",
                    isSelected
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/30"
                  )}
                >
                  <platform.icon className={cn("w-4 h-4", isSelected ? "text-secondary-foreground" : "text-primary/40")} />
                  {platform.name}
                </button>
              );
            })}
          </div>

          {/* Main Editor */}
          <div className="card-warm p-2 relative group">
             <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={handleRefine}
                  disabled={isRefining || !content}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-md hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50 disabled:scale-100"
                >
                  {isRefining ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Magic Refine
                </button>
             </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start typing your story..."
              className="w-full h-96 p-10 bg-transparent focus:outline-none resize-none font-medium placeholder:text-muted-foreground/30 text-xl leading-relaxed text-foreground/80"
            />
            
            <div className="flex items-center justify-between p-6 border-t border-border/30 bg-muted/10 rounded-b-[1.5rem]">
              <div className="flex items-center gap-4">
                <button className="p-3 bg-background border border-border rounded-2xl hover:bg-primary/5 transition-all shadow-soft group/btn">
                  <ImageIcon className="w-5 h-5 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                </button>
                <div className="h-6 w-px bg-border/50 mx-1" />
                <span className={cn(
                  "text-xs font-bold tracking-widest uppercase",
                  content.length > minLimit ? "text-red-500" : "text-muted-foreground/60"
                )}>
                  {content.length} / {minLimit}
                </span>
              </div>
              
              {content.length > minLimit && (
                <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest animate-in fade-in duration-300">
                  <Info className="w-3.5 h-3.5" />
                  Space limited for {selectedPlatforms.filter(p => PLATFORMS.find(pl => pl.id === p)?.limit === minLimit).join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="flex items-center gap-3 px-2">
             <div className="w-2 h-2 rounded-full bg-secondary" />
             <h2 className="text-xl font-display font-bold tracking-tight">Your story in the world</h2>
          </div>

          <div className="space-y-8 max-h-[70vh] overflow-auto pr-2 pb-10 scrollbar-hide">
            {selectedPlatforms.map(platformId => {
              const platform = PLATFORMS.find(p => p.id === platformId);
              if (!platform) return null;

              return (
                <div key={platformId} className="bg-background border border-border/50 rounded-[2.5rem] shadow-lg overflow-hidden group transition-all hover:border-primary/20">
                  <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-muted/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-background rounded-lg border border-border shadow-soft">
                        <platform.icon className="w-3.5 h-3.5 text-primary/60" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">{platform.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex-shrink-0 flex items-center justify-center text-secondary font-bold border border-secondary/10">K</div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-24 bg-muted rounded-full animate-pulse" />
                          <div className="h-2 w-12 bg-muted/50 rounded-full animate-pulse" />
                        </div>
                        <p className={cn(
                          "text-base leading-relaxed font-medium text-foreground/70 whitespace-pre-wrap",
                          !content && "text-muted-foreground/30 italic font-normal"
                        )}>
                          {content || "Your story will unfold here..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
