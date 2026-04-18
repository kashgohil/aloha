"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { CostCapExceededError } from "@/lib/ai/cost-cap";
import {
  CAMPAIGN_KINDS,
  type CampaignKind,
  generateCampaign,
  loadCampaign,
  markBeatAccepted,
  regenerateCampaignBeat,
} from "@/lib/ai/campaign";
import { getCurrentUser } from "@/lib/current-user";

const isKind = (v: unknown): v is CampaignKind =>
  typeof v === "string" && (CAMPAIGN_KINDS as readonly string[]).includes(v);

export async function createCampaignAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const kindRaw = formData.get("kind");
  if (!goal) throw new Error("Goal is required.");
  if (!isKind(kindRaw)) throw new Error("Pick a campaign kind.");

  const channels = formData
    .getAll("channels")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (channels.length === 0) throw new Error("Pick at least one channel.");

  const rangeStartStr = String(formData.get("rangeStart") ?? "").trim();
  const rangeEndStr = String(formData.get("rangeEnd") ?? "").trim();
  if (!rangeStartStr || !rangeEndStr) throw new Error("Pick a date range.");
  const rangeStart = new Date(`${rangeStartStr}T00:00:00Z`);
  const rangeEnd = new Date(`${rangeEndStr}T23:59:59Z`);

  let campaignId: string;
  try {
    const campaign = await generateCampaign({
      userId: user.id,
      name,
      goal,
      kind: kindRaw,
      channels,
      rangeStart,
      rangeEnd,
    });
    campaignId = campaign.campaignId;
  } catch (err) {
    if (err instanceof CostCapExceededError) throw err;
    throw err;
  }

  revalidatePath("/app/campaigns");
  redirect(`/app/campaigns/${campaignId}`);
}

// Accepts one or more beats: one draft post per beat, campaignId stamped
// on the post for provenance + calendar tinting, scheduled for noon UTC on
// the beat's date. User tunes the time in composer.
export async function acceptCampaignBeatsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const campaignId = String(formData.get("campaignId") ?? "");
  const beatIds = formData
    .getAll("beatIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!campaignId || beatIds.length === 0) {
    throw new Error("Pick at least one beat to accept.");
  }

  const campaign = await loadCampaign(user.id, campaignId);
  if (!campaign) throw new Error("Campaign not found.");

  for (const beat of campaign.beats) {
    if (!beatIds.includes(beat.id)) continue;
    if (beat.accepted) continue;

    const scheduledAt = new Date(`${beat.date}T12:00:00Z`);
    const content = beat.title + (beat.angle ? `\n\n${beat.angle}` : "");
    const [post] = await db
      .insert(posts)
      .values({
        userId: user.id,
        content,
        platforms: [beat.channel],
        status: "draft",
        scheduledAt,
        campaignId: campaign.id,
      })
      .returning({ id: posts.id });
    await markBeatAccepted(campaignId, beat.id, post.id);
  }

  revalidatePath(`/app/campaigns/${campaignId}`);
  revalidatePath("/app/calendar");
  redirect(`/app/campaigns/${campaignId}?accepted=1`);
}

export async function regenerateCampaignBeatAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const campaignId = String(formData.get("campaignId") ?? "");
  const beatId = String(formData.get("beatId") ?? "");
  if (!campaignId || !beatId) throw new Error("campaignId and beatId required");

  try {
    await regenerateCampaignBeat(user.id, campaignId, beatId);
  } catch (err) {
    if (err instanceof CostCapExceededError) throw err;
    throw err;
  }

  revalidatePath(`/app/campaigns/${campaignId}`);
  redirect(`/app/campaigns/${campaignId}`);
}
