import { db } from "@/db";
import { pages, links } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowRight, Zap, ShieldCheck } from "lucide-react";
import SubscribeForm from "./subscribe-form";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
    with: {
      links: {
        orderBy: [asc(links.order)],
      },
    },
  }) as any;

  if (!page) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans bg-grid flex flex-col items-center justify-center p-4 py-20">
      {/* Profile Card */}
      <div className="w-full max-w-md border-2 border-industrial bg-background p-8 space-y-8 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
        {/* Header Decals */}
        <div className="absolute top-0 right-0 p-2 flex gap-1">
           <div className="w-1 h-1 bg-accent opacity-20" />
           <div className="w-1 h-1 bg-accent opacity-40" />
           <div className="w-1 h-1 bg-accent opacity-60" />
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 border-2 border-industrial bg-muted relative group overflow-hidden">
             {page.avatarUrl ? (
                <img src={page.avatarUrl} alt={page.title || ""} className="w-full h-full object-cover grayscale" />
             ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-4xl italic opacity-20 group-hover:opacity-40 transition-opacity select-none">
                   {page.title?.charAt(0) || "A"}
                </div>
             )}
             <div className="absolute inset-0 border-industrial opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              {page.title || "OPERATIVE"}
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] font-bold">
              ID: {page.slug.toUpperCase()} // STATUS: ACTIVE
            </p>
          </div>

          <p className="text-sm font-medium leading-relaxed opacity-80 max-w-xs">
            {page.bio || "INITIALIZING BIOMETRIC DATA STREAM..."}
          </p>
        </div>

        {/* Links Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4 overflow-hidden">
             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Transmission Links</div>
             <div className="h-px w-full bg-industrial opacity-20" />
          </div>

          <div className="space-y-2">
            {page.links.map((link: any) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full p-4 border-industrial border bg-background hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-between"
              >
                <span className="font-black uppercase tracking-tight text-sm">{link.title}</span>
                <ArrowRight className="w-4 h-4 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
              </a>
            ))}
          </div>
        </div>

        {/* Lead Capture */}
        <div className="pt-4 space-y-4">
          <div className="flex items-center gap-2 mb-4 overflow-hidden">
             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Mission Control Sync</div>
             <div className="h-px w-full bg-industrial opacity-20" />
          </div>
          
          <SubscribeForm userId={page.userId} />
        </div>

        {/* Footer Decal */}
        <div className="pt-8 flex items-center justify-between opacity-20">
           <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 fill-current" />
              <span className="text-[8px] font-black uppercase tracking-widest italic">Powered by Aloha</span>
           </div>
           <ShieldCheck className="w-4 h-4" />
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-5">
         <div className="absolute top-20 left-20 text-[20vw] font-black uppercase italic tracking-tighter text-foreground rotate-[-15deg] leading-none">Aloha</div>
         <div className="absolute bottom-20 right-20 text-[20vw] font-black uppercase italic tracking-tighter text-foreground rotate-[-15deg] leading-none">Mission</div>
      </div>
    </div>
  );
}
