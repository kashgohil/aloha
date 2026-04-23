import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, links, assets } from "@/db/schema";
import { notFound } from "next/navigation";
import SubscribeForm from "./subscribe-form";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  resolveTheme,
} from "@/lib/audience-templates";
import { getAccent } from "@/lib/audience-templates/tokens";
import { isCustomThemeEnabled } from "@/lib/billing/entitlements";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await db.query.pages.findFirst({
    where: eq(pages.slug, slug),
  });
  if (!page) notFound();

  const [pageLinks, avatarAsset, backgroundAsset] = await Promise.all([
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
  ]);

  // Owner may have downgraded after customizing — fall back to the default
  // template + defaults but keep their saved choices in the DB so an upgrade
  // restores them.
  const themeAllowed = await isCustomThemeEnabled(page.createdByUserId);
  const effectiveTemplateId = themeAllowed
    ? page.templateId
    : DEFAULT_TEMPLATE_ID;
  const template = getTemplate(effectiveTemplateId);
  const theme = resolveTheme(template, themeAllowed ? page.theme : null);

  const avatarUrl = avatarAsset?.url ?? page.avatarUrl ?? null;
  const backgroundUrl = themeAllowed ? (backgroundAsset?.url ?? null) : null;

  const Template = template.Component;
  return (
    <Template
      page={{
        id: page.id,
        userId: page.createdByUserId,
        slug: page.slug,
        title: page.title,
        bio: page.bio,
        avatarUrl: page.avatarUrl,
        templateId: page.templateId,
        theme: page.theme,
      }}
      links={pageLinks.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        order: l.order,
        iconPresetId: l.iconPresetId,
      }))}
      theme={theme}
      avatarUrl={avatarUrl}
      backgroundUrl={backgroundUrl}
      subscribeSlot={
        <SubscribeForm
          userId={page.createdByUserId}
          variant={template.subscribeVariant ?? "default"}
          accentColor={getAccent(theme.accentId).color}
        />
      }
      footerSlot={
        <Link
          href="/"
          className="inline-flex items-baseline gap-1 opacity-90 hover:opacity-100 transition-opacity"
          style={{ color: "currentColor" }}
        >
          <span className="text-[11px] uppercase tracking-[0.22em]">
            Made with
          </span>
          <span className="font-display text-[15px] leading-none font-semibold tracking-[-0.03em]">
            Aloha
          </span>
          <span
            className="font-display text-[13px] leading-none"
            style={{ color: getAccent(theme.accentId).color }}
          >
            .
          </span>
        </Link>
      }
    />
  );
}
