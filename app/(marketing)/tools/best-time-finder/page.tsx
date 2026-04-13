import { makeMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { siblingTools } from "@/lib/tools";
import { ToolShell } from "../_components/tool-shell";
import { BestTimeFinder } from "./best-time-finder";

export const metadata = makeMetadata({
  title: "Best-time finder — quiet windows that still work",
  description:
    "A free tool. Pick a channel and a timezone; get the engagement-by-hour curve and the two windows worth defending.",
  path: routes.tools.bestTimeFinder,
});

export default function BestTimeFinderPage() {
  return (
    <ToolShell
      eyebrow="Best-time finder"
      headline={
        <>
          Quiet windows
          <br />
          <span className="italic text-primary font-light">that still work.</span>
        </>
      }
      lead="Channel + timezone in. Peak window + secondary window out. Uses global averages for each network — your real data is tighter, and Aloha re-learns yours weekly inside the product."
      tool={<BestTimeFinder />}
      howItWorks={[
        "Pick a channel; we pull a 24-hour intensity curve from our public dataset (the same one shown on each /channels/* page).",
        "Pick your timezone; we shift the curve so the x-axis reads in your local hours.",
        "The peak bar is highlighted; we surface a secondary window at least four hours away as a fallback.",
        "All client-side — nothing is sent to any server. Refresh to start over.",
      ]}
      productFeature={{
        name: "the Calendar",
        href: "/calendar",
        pitch: "Aloha's Calendar learns your peak windows from your last 90 days — drag-to-schedule snaps to them by default.",
      }}
      otherTools={siblingTools("best-time-finder")}
    />
  );
}
