import type { ReactNode } from "react";
import { JsonLd } from "@/lib/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { MarketingNav } from "./_components/nav";
import { MarketingFooter } from "./_components/footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-white">
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
