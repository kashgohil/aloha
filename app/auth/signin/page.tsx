import { signIn } from "@/auth";
import { Heart, Globe, Share2, Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-10 relative">
        {/* Branding */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg transform rotate-3">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold tracking-tight">Welcome home.</h1>
            <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-widest">Connect to your digital garden</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-background border border-border/50 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <Sparkles className="w-12 h-12 text-primary" />
          </div>

          <div className="space-y-6 relative z-10">
            <div className="space-y-4">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/app/dashboard" });
                }}
              >
                <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-background border-2 border-border rounded-full font-bold text-sm transition-all hover:bg-muted/50 hover:border-primary/30 group">
                  <Globe className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  Continue with Google
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/app/dashboard" });
                }}
              >
                <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-background border-2 border-border rounded-full font-bold text-sm transition-all hover:bg-muted/50 hover:border-primary/30 group">
                  <Globe className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  Continue with GitHub
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await signIn("twitter", { redirectTo: "/app/dashboard" });
                }}
              >
                <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-background border-2 border-border rounded-full font-bold text-sm transition-all hover:bg-muted/50 hover:border-primary/30 group">
                  <Share2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  Continue with X / Twitter
                </button>
              </form>
            </div>

            <div className="pt-6 text-center">
               <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                 By joining Aloha, you agree to nurture your community with kindness and respect.
               </p>
            </div>
          </div>
        </div>

        {/* Support Link */}
        <div className="text-center">
           <a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-primary/30">Need help accessing your terminal?</a>
        </div>
      </div>
    </div>
  );
}
