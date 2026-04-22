import { asc, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { assets, links, pages } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { isCustomThemeEnabled } from "@/lib/billing/entitlements";
import { DesignEditor } from "./_components/design-editor";

export const dynamic = "force-dynamic";

// Sample links shown in the preview when the user hasn't added any links
// yet — so the preview still communicates the template's link styling and
// accent color at a glance.
const SAMPLE_LINKS = [
  {
    id: "sample-1",
    title: "Latest essay",
    url: "https://example.com",
    order: 0,
    iconPresetId: "substack" as string | null,
  },
  {
    id: "sample-2",
    title: "YouTube",
    url: "https://youtube.com",
    order: 1,
    iconPresetId: "youtube" as string | null,
  },
  {
    id: "sample-3",
    title: "Work portfolio",
    url: "https://example.com",
    order: 2,
    iconPresetId: "globe" as string | null,
  },
];

export default async function AudienceDesignPage() {
  const user = (await getCurrentUser())!;

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, user.id),
  });
  if (!page) redirect("/app/audience");

  const [pageLinks, avatarAsset, backgroundAsset, customThemeEnabled] =
    await Promise.all([
      db
        .select()
        .from(links)
        .where(eq(links.pageId, page.id))
        .orderBy(asc(links.order)),
      page.avatarAssetId
        ? db.query.assets.findFirst({ where: eq(assets.id, page.avatarAssetId) })
        : Promise.resolve(null),
      page.backgroundAssetId
        ? db.query.assets.findFirst({
            where: eq(assets.id, page.backgroundAssetId),
          })
        : Promise.resolve(null),
      isCustomThemeEnabled(user.id),
    ]);

  const avatarUrl = avatarAsset?.url ?? page.avatarUrl ?? null;
  const backgroundRef = backgroundAsset
    ? { id: backgroundAsset.id, url: backgroundAsset.url }
    : null;

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <Link
            href="/app/audience"
            className="inline-flex items-center gap-1.5 text-[12px] text-ink/55 hover:text-ink transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Audience
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            Design
          </p>
          <h1 className="mt-3 font-display text-[40px] lg:text-[48px] leading-[1.02] tracking-[-0.03em] text-ink font-normal">
            Make it <span className="text-primary">yours.</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink/65 max-w-xl leading-[1.55]">
            Pick a template, tune the type and color, and set a background.
            Changes publish right away.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full border border-border-strong text-[14px] font-medium text-ink hover:border-ink transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View public page
          </Link>
        </div>
      </header>

      <DesignEditor
        initial={{
          templateId: page.templateId,
          theme: page.theme ?? {},
          backgroundAsset: backgroundRef,
        }}
        previewPage={{
          id: page.id,
          userId: page.userId,
          slug: page.slug,
          title: page.title,
          bio: page.bio,
          avatarUrl: page.avatarUrl,
        }}
        previewLinks={
          pageLinks.length > 0
            ? pageLinks.slice(0, 5).map((l) => ({
                id: l.id,
                title: l.title,
                url: l.url,
                order: l.order,
                iconPresetId: l.iconPresetId,
              }))
            : SAMPLE_LINKS
        }
        previewAvatarUrl={avatarUrl}
        customThemeEnabled={customThemeEnabled}
      />
    </div>
  );
}
