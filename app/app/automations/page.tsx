import { 
  Zap, 
  Activity, 
  Settings2, 
  ArrowRight, 
  Mail, 
  Share2,
  CheckCircle2,
  Clock,
  Play
} from "lucide-react";
import AutomationCanvas from "./automation-canvas";

const activeRoutines = [
  {
    id: "welcome-seq",
    name: "Strategic Welcome Sync",
    trigger: "New Subscriber joined Mission Control",
    action: "Deploy 3-part Email Sequence via Resend",
    status: "Active",
    executions: 124,
    health: 100
  },
  {
    id: "post-notify",
    name: "Broadcast Notification",
    trigger: "Social Post successfully published",
    action: "Transmit alert to Slack channel #marketing",
    status: "Active",
    executions: 842,
    health: 98
  }
];

export default function AutomationsPage() {
  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic text-accent">
            Workflow Matrix
          </h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
            ENGINEERING AUTONOMOUS RECURSIVE OPERATIONS
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="button-industrial active-industrial text-[10px] font-black uppercase tracking-widest px-8">
             <Zap className="w-4 h-4 fill-current" />
             New Routine
           </button>
           <button className="button-industrial text-[10px] font-black uppercase tracking-widest">
             <Settings2 className="w-4 h-4" />
             Matrix Config
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Active Routines */}
        <div className="lg:col-span-4 space-y-6 overflow-auto pr-2">
           <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-accent" />
              <h2 className="font-black uppercase tracking-tight text-sm uppercase italic">Active Routines</h2>
           </div>

           <div className="space-y-4">
              {activeRoutines.map((routine) => (
                 <div key={routine.id} className="p-6 border-industrial bg-background hover:bg-muted transition-all group cursor-pointer relative overflow-hidden">
                    {/* Progress Bar Decal */}
                    <div className="absolute bottom-0 left-0 h-1 bg-accent/20 w-full overflow-hidden">
                       <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${routine.health}%` }} />
                    </div>

                    <div className="flex justify-between items-start mb-4">
                       <div className="p-2 bg-muted border-industrial group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                          <Zap className="w-5 h-5" />
                       </div>
                       <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 text-[8px] font-black uppercase tracking-widest border border-green-500/20">
                          {routine.status}
                       </div>
                    </div>

                    <div className="space-y-1 mb-6">
                       <h3 className="font-black uppercase tracking-tight text-sm">{routine.name}</h3>
                       <p className="text-[10px] text-muted-foreground uppercase font-medium">{routine.trigger}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-industrial">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Executions</span>
                          <span className="font-mono text-sm font-bold">{routine.executions.toLocaleString()}</span>
                       </div>
                       <button className="p-2 border-industrial hover:bg-accent hover:text-accent-foreground transition-all">
                          <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              ))}

              <div className="p-8 border-industrial border-dashed bg-muted/20 flex flex-col items-center justify-center text-center gap-4 py-12 group hover:border-accent transition-colors cursor-pointer">
                 <div className="w-12 h-12 border-industrial bg-background flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-muted-foreground" />
                 </div>
                 <div>
                    <div className="font-black uppercase tracking-tight text-xs">Analyze Performance</div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Review operational efficiency</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Visual Blueprint */}
        <div className="lg:col-span-8 space-y-4 flex flex-col h-full min-h-[500px]">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-accent" />
                 <h2 className="font-black uppercase tracking-tight text-sm uppercase italic text-muted-foreground">Blueprint Terminal</h2>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    LAST SYNC: 02:45:12
                 </div>
                 <button className="flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest hover:bg-accent/90">
                    <Play className="w-3 h-3 fill-current" />
                    Test Matrix
                 </button>
              </div>
           </div>

           <div className="flex-1 border-2 border-industrial bg-background relative overflow-hidden">
              <AutomationCanvas />
           </div>
        </div>
      </div>
    </div>
  );
}
