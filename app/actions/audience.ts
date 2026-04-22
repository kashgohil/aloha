"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { assets, pages, links, subscribers } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { dispatchEvent } from "@/lib/automations/dispatch";
import { ICON_NONE, ICON_PRESETS } from "@/lib/audience-templates/link-icons";
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from "@/lib/audience-templates";
import {
  ACCENTS,
  BACKGROUND_PRESETS,
  FONT_PAIRS,
} from "@/lib/audience-templates/tokens";
import { LINKS_PER_PAGE_LIMIT } from "@/lib/audience-limits";
import { isCustomThemeEnabled } from "@/lib/billing/entitlements";
import type { PageTheme } from "@/db/schema";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function updatePage(formData: FormData) {
  const userId = await requireUserId();

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const title = String(formData.get("title") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;

  if (!SLUG_RE.test(slug)) {
    throw new Error(
      "Slug must be 3–40 characters, lowercase letters, digits, or hyphens.",
    );
  }

  const existing = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });

  if (existing) {
    await db
      .update(pages)
      .set({ slug, title, bio, updatedAt: new Date() })
      .where(eq(pages.id, existing.id));
  } else {
    await db.insert(pages).values({ userId, slug, title, bio });
  }

  revalidatePath("/app/audience");
  revalidatePath(`/u/${slug}`);
  return { created: !existing };
}

export async function addLink(formData: FormData) {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!title) throw new Error("Link needs a title.");
  try {
    new URL(url);
  } catch {
    throw new Error("That URL doesn't look right. Include https://");
  }

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) {
    throw new Error("Set up your public page first, then add links.");
  }

  const existing = await db
    .select({ order: links.order })
    .from(links)
    .where(eq(links.pageId, page.id));

  if (existing.length >= LINKS_PER_PAGE_LIMIT) {
    throw new Error(
      `Link limit reached (${LINKS_PER_PAGE_LIMIT}). Remove one to add another.`,
    );
  }

  const nextOrder =
    existing.length > 0 ? Math.max(...existing.map((l) => l.order)) + 1 : 0;

  await db.insert(links).values({
    pageId: page.id,
    title,
    url,
    order: nextOrder,
  });

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

export async function reorderLinks(orderedIds: string[]) {
  const userId = await requireUserId();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) throw new Error("No page to reorder.");

  if (orderedIds.length === 0) return;

  // Owner + scope check: every id must belong to this page. Reject the whole
  // request if any foreign id is present.
  const owned = await db
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.pageId, page.id), inArray(links.id, orderedIds)));
  if (owned.length !== orderedIds.length) {
    throw new Error("Invalid link in reorder request.");
  }

  // Single-statement CASE update so all rows move in one round trip.
  const cases = sql.join(
    orderedIds.map(
      (id, idx) => sql`WHEN ${links.id} = ${id} THEN ${idx}::int`,
    ),
    sql.raw(" "),
  );
  await db
    .update(links)
    .set({ order: sql`CASE ${cases} END`, updatedAt: new Date() })
    .where(and(eq(links.pageId, page.id), inArray(links.id, orderedIds)));

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

export async function updateLinkIcon(linkId: string, iconPresetId: string | null) {
  const userId = await requireUserId();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) throw new Error("No page.");

  // Validate preset id: null (auto), "none" (hide), or a known preset key.
  if (
    iconPresetId !== null &&
    iconPresetId !== ICON_NONE &&
    !ICON_PRESETS[iconPresetId]
  ) {
    throw new Error("Unknown icon preset.");
  }

  await db
    .update(links)
    .set({ iconPresetId, updatedAt: new Date() })
    .where(and(eq(links.id, linkId), eq(links.pageId, page.id)));

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

export async function deleteLink(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) return;

  await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.pageId, page.id)));

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

async function requireOwnedAsset(userId: string, assetId: string) {
  const asset = await db.query.assets.findFirst({
    where: and(eq(assets.id, assetId), eq(assets.userId, userId)),
  });
  if (!asset) throw new Error("Asset not found.");
  return asset;
}

export async function setAvatarAsset(assetId: string | null) {
  const userId = await requireUserId();
  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) throw new Error("Set up your page first.");

  if (assetId) await requireOwnedAsset(userId, assetId);

  await db
    .update(pages)
    .set({ avatarAssetId: assetId, updatedAt: new Date() })
    .where(eq(pages.id, page.id));

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

export async function setBackgroundAsset(assetId: string | null) {
  const userId = await requireUserId();
  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) throw new Error("Set up your page first.");

  if (assetId) {
    if (!(await isCustomThemeEnabled(userId))) {
      throw new Error("Custom backgrounds need a paid plan.");
    }
    await requireOwnedAsset(userId, assetId);
  }

  await db
    .update(pages)
    .set({ backgroundAssetId: assetId, updatedAt: new Date() })
    .where(eq(pages.id, page.id));

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

export async function setPageDesign(input: {
  templateId: string;
  theme: PageTheme | null;
}) {
  const userId = await requireUserId();
  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, userId),
  });
  if (!page) throw new Error("Set up your page first.");

  if (!TEMPLATES[input.templateId]) {
    throw new Error("Unknown template.");
  }

  const allowed = await isCustomThemeEnabled(userId);
  const isDefaults =
    input.templateId === DEFAULT_TEMPLATE_ID && input.theme === null;

  if (!allowed && !isDefaults) {
    throw new Error("Custom themes need a paid plan.");
  }

  if (input.theme) {
    const { fontPairId, accentId, backgroundPresetId } = input.theme;
    if (fontPairId && !FONT_PAIRS.some((f) => f.id === fontPairId)) {
      throw new Error("Unknown font pair.");
    }
    if (accentId && !ACCENTS.some((a) => a.id === accentId)) {
      throw new Error("Unknown accent.");
    }
    if (
      backgroundPresetId &&
      !BACKGROUND_PRESETS.some((b) => b.id === backgroundPresetId)
    ) {
      throw new Error("Unknown background.");
    }
  }

  await db
    .update(pages)
    .set({
      templateId: input.templateId,
      theme: input.theme,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, page.id));

  revalidatePath("/app/audience");
  revalidatePath(`/u/${page.slug}`);
}

export async function subscribe(data: { email: string; userId: string }) {
  try {
    const [row] = await db
      .insert(subscribers)
      .values({
        userId: data.userId,
        email: data.email,
        tags: ["lead", "public-page"],
      })
      .returning({ id: subscribers.id, email: subscribers.email });

    // Fire-and-forget: failed dispatch should not fail the subscribe action.
    dispatchEvent({
      triggerKind: "subscriber_joined",
      userId: data.userId,
      payload: { subscriberId: row.id, email: row.email },
    }).catch((err) =>
      console.error("[automations] subscribe dispatch failed", err),
    );

    return { success: true };
  } catch (error) {
    console.error("Subscription Error:", error);
    return { error: "Couldn't join the list. Try again." };
  }
}
