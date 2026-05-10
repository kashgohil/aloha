"use server";

import { db } from "@/db";
import { campaigns, posts } from "@/db/schema";
import {
	addSiblingBeat,
	CAMPAIGN_KINDS,
	changeCampaignBeatFormat,
	composeBeatBody,
	deleteCampaignBeat,
	editCampaignBeat,
	formatGuidanceFor,
	generateCampaign,
	isCadenceKind,
	loadCampaign,
	markBeatAccepted,
	regenerateCampaignBeat,
	rescheduleCampaignBeat,
	type BeatEditPatch,
	type CampaignKind,
} from "@/lib/ai/campaign";
import { CostCapExceededError } from "@/lib/ai/cost-cap";
import { requireMuseAccess } from "@/lib/billing/muse";
import { computeLifecycleStatus } from "@/lib/campaigns/lifecycle";
import { env } from "@/lib/env";
import { assertRole } from "@/lib/workspaces/assert-role";
import { ROLES } from "@/lib/workspaces/roles";
import { fitContentToChannelLimit } from "@/lib/channels/fit-to-limit";
import { qstashClient } from "@/lib/qstash";
import { and, eq, gt, inArray, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const isKind = (v: unknown): v is CampaignKind =>
	typeof v === "string" && (CAMPAIGN_KINDS as readonly string[]).includes(v);

const parseStringList = (raw: string): string[] =>
	raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

export async function createCampaignAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);
	const user = ctx.user;
	await requireMuseAccess(user.id);

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

	// Themes + postsPerWeek only matter for cadence kinds. For arc kinds we
	// pass empty/null so the campaign row stays consistent with its shape.
	const cadence = isCadenceKind(kindRaw);
	const themes = cadence
		? parseStringList(String(formData.get("themes") ?? ""))
		: [];
	const postsPerWeek = cadence
		? Math.max(1, Math.min(14, Number(formData.get("postsPerWeek") ?? 5)))
		: null;

	let campaignId: string;
	try {
		const campaign = await generateCampaign({
			userId: user.id,
			name,
			goal,
			kind: kindRaw,
			channels,
			themes,
			postsPerWeek,
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
// the beat's date. Cadence beats carry rich scaffolding (hook, keyPoints,
// cta, hashtags, mediaSuggestion, rationale) into `draftMeta` so the
// composer sidebar lights up the same way it does for Muse-drafted posts.
// User tunes the time in composer.
export async function acceptCampaignBeatsAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);
	const user = ctx.user;

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
		const content = fitContentToChannelLimit(
			composeBeatBody(beat),
			beat.channel,
			beat.format,
		);
		const draftMeta = {
			...(beat.hook ? { hook: beat.hook } : {}),
			...(beat.keyPoints && beat.keyPoints.length > 0
				? { keyPoints: beat.keyPoints }
				: {}),
			...(beat.cta ? { cta: beat.cta } : {}),
			...(beat.hashtags && beat.hashtags.length > 0
				? { hashtags: beat.hashtags }
				: {}),
			...(beat.mediaSuggestion
				? { mediaSuggestion: beat.mediaSuggestion }
				: {}),
			...(beat.rationale ? { rationale: beat.rationale } : {}),
			format: beat.format,
			formatGuidance: formatGuidanceFor(beat.format, beat.channel),
		};
		const [post] = await db
			.insert(posts)
			.values({
				createdByUserId: user.id,
				workspaceId: ctx.workspace.id,
				content,
				platforms: [beat.channel],
				status: "draft",
				scheduledAt,
				campaignId: campaign.id,
				draftMeta: Object.keys(draftMeta).length > 0 ? draftMeta : null,
			})
			.returning({ id: posts.id });
		await markBeatAccepted(campaignId, beat.id, post.id);
	}

	revalidatePath(`/app/campaigns/${campaignId}`);
	revalidatePath("/app/calendar");
	redirect(`/app/campaigns/${campaignId}`);
}

export async function regenerateCampaignBeatAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);
	const user = ctx.user;
	await requireMuseAccess(user.id);

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

// Sweep all draft posts under this campaign whose scheduledAt is still in
// the future, flip them to `scheduled`, and enqueue QStash. Past-due drafts
// are left alone (firing immediately surprises the user — same rule as
// resume). Idempotent: re-running picks up beats accepted after the first
// approval. Campaign row lands on the lifecycle state for today's date.
export async function approveCampaignAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);

	const campaignId = String(formData.get("campaignId") ?? "");
	if (!campaignId) throw new Error("campaignId required");

	const [row] = await db
		.select({
			id: campaigns.id,
			rangeStart: campaigns.rangeStart,
			rangeEnd: campaigns.rangeEnd,
		})
		.from(campaigns)
		.where(
			and(
				eq(campaigns.id, campaignId),
				eq(campaigns.workspaceId, ctx.workspace.id),
			),
		)
		.limit(1);
	if (!row) throw new Error("Campaign not found.");

	const now = new Date();
	const sweepable = await db
		.select({ id: posts.id, scheduledAt: posts.scheduledAt })
		.from(posts)
		.where(
			and(
				eq(posts.campaignId, campaignId),
				eq(posts.workspaceId, ctx.workspace.id),
				eq(posts.status, "draft"),
				isNotNull(posts.scheduledAt),
				gt(posts.scheduledAt, now),
			),
		);

	if (sweepable.length > 0) {
		const ids = sweepable.map((r) => r.id);
		await db
			.update(posts)
			.set({ status: "scheduled", updatedAt: now })
			.where(
				and(eq(posts.workspaceId, ctx.workspace.id), inArray(posts.id, ids)),
			);

		for (const r of sweepable) {
			if (!r.scheduledAt) continue;
			const delay = Math.max(
				0,
				Math.floor((r.scheduledAt.getTime() - Date.now()) / 1000),
			);
			await qstashClient.publishJSON({
				url: `${env.APP_URL}/api/qstash`,
				body: {
					postId: r.id,
					intendedScheduledAt: r.scheduledAt.toISOString(),
				},
				delay,
			});
		}
	}

	const nextStatus = computeLifecycleStatus(
		now,
		row.rangeStart,
		row.rangeEnd,
	);
	await db
		.update(campaigns)
		.set({ status: nextStatus, updatedAt: now })
		.where(eq(campaigns.id, campaignId));

	revalidatePath(`/app/campaigns/${campaignId}`);
	revalidatePath("/app/campaigns");
	revalidatePath("/app/calendar");
	redirect(`/app/campaigns/${campaignId}`);
}

// Pauses an active campaign. Flips the campaign row to "paused" and
// demotes every *scheduled* post tied to it back to "draft" — scheduledAt
// is preserved so resume can put them back on the clock without asking
// for a time. Already-published and already-draft posts are untouched.
//
// Pending QStash messages for those posts still fire at their original
// time, but the worker gates on status === "scheduled" and returns 400,
// so nothing publishes. On resume we re-enqueue for any future-dated post
// whose original QStash message has already fired-and-noop'd.
export async function pauseCampaignAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);

	const campaignId = String(formData.get("campaignId") ?? "");
	if (!campaignId) throw new Error("campaignId required");

	const [row] = await db
		.select({ id: campaigns.id })
		.from(campaigns)
		.where(
			and(
				eq(campaigns.id, campaignId),
				eq(campaigns.workspaceId, ctx.workspace.id),
			),
		)
		.limit(1);
	if (!row) throw new Error("Campaign not found.");

	await db
		.update(posts)
		.set({ status: "draft", updatedAt: new Date() })
		.where(
			and(
				eq(posts.campaignId, campaignId),
				eq(posts.workspaceId, ctx.workspace.id),
				eq(posts.status, "scheduled"),
			),
		);

	await db
		.update(campaigns)
		.set({ status: "paused", updatedAt: new Date() })
		.where(eq(campaigns.id, campaignId));

	revalidatePath(`/app/campaigns/${campaignId}`);
	revalidatePath("/app/campaigns");
	revalidatePath("/app/calendar");
	redirect(`/app/campaigns/${campaignId}`);
}

// Resumes a paused campaign. Promotes every paused post (status === "draft"
// with campaignId + a future scheduledAt) back to "scheduled", re-enqueuing
// QStash delivery at its preserved scheduledAt. Past-due posts stay as
// drafts — firing them immediately would surprise the user. The campaign
// row is set to whichever lifecycle state matches today's date vs the
// range, so resuming inside the window jumps straight to "running" and
// resuming after it has passed lands on "complete".
export async function resumeCampaignAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);

	const campaignId = String(formData.get("campaignId") ?? "");
	if (!campaignId) throw new Error("campaignId required");

	const [row] = await db
		.select({
			id: campaigns.id,
			rangeStart: campaigns.rangeStart,
			rangeEnd: campaigns.rangeEnd,
		})
		.from(campaigns)
		.where(
			and(
				eq(campaigns.id, campaignId),
				eq(campaigns.workspaceId, ctx.workspace.id),
			),
		)
		.limit(1);
	if (!row) throw new Error("Campaign not found.");

	const now = new Date();
	const resumable = await db
		.select({ id: posts.id, scheduledAt: posts.scheduledAt })
		.from(posts)
		.where(
			and(
				eq(posts.campaignId, campaignId),
				eq(posts.workspaceId, ctx.workspace.id),
				eq(posts.status, "draft"),
				isNotNull(posts.scheduledAt),
				gt(posts.scheduledAt, now),
			),
		);

	if (resumable.length > 0) {
		const ids = resumable.map((r) => r.id);
		await db
			.update(posts)
			.set({ status: "scheduled", updatedAt: now })
			.where(
				and(eq(posts.workspaceId, ctx.workspace.id), inArray(posts.id, ids)),
			);

		for (const r of resumable) {
			if (!r.scheduledAt) continue;
			const delay = Math.max(
				0,
				Math.floor((r.scheduledAt.getTime() - Date.now()) / 1000),
			);
			await qstashClient.publishJSON({
				url: `${env.APP_URL}/api/qstash`,
				body: {
					postId: r.id,
					intendedScheduledAt: r.scheduledAt.toISOString(),
				},
				delay,
			});
		}
	}

	const nextStatus = computeLifecycleStatus(
		now,
		row.rangeStart,
		row.rangeEnd,
	);
	await db
		.update(campaigns)
		.set({ status: nextStatus, updatedAt: now })
		.where(eq(campaigns.id, campaignId));

	revalidatePath(`/app/campaigns/${campaignId}`);
	revalidatePath("/app/campaigns");
	revalidatePath("/app/calendar");
	redirect(`/app/campaigns/${campaignId}`);
}

// Deletes a campaign. Soft-deletes every draft / scheduled / failed post
// tied to it (status=deleted + deletedAt; matches the pattern in
// deletePost, so the 30-day purge sweeps them) and then hard-deletes the
// campaign row. Published posts are preserved — deleting a campaign
// shouldn't wipe history. Irreversible; UI must confirm.
export async function deleteCampaignAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);

	const campaignId = String(formData.get("campaignId") ?? "");
	if (!campaignId) throw new Error("campaignId required");

	const [row] = await db
		.select({ id: campaigns.id })
		.from(campaigns)
		.where(
			and(
				eq(campaigns.id, campaignId),
				eq(campaigns.workspaceId, ctx.workspace.id),
			),
		)
		.limit(1);
	if (!row) throw new Error("Campaign not found.");

	const now = new Date();
	await db
		.update(posts)
		.set({ status: "deleted", deletedAt: now, updatedAt: now })
		.where(
			and(
				eq(posts.campaignId, campaignId),
				eq(posts.workspaceId, ctx.workspace.id),
				inArray(posts.status, ["draft", "scheduled", "failed"]),
			),
		);

	await db.delete(campaigns).where(eq(campaigns.id, campaignId));

	revalidatePath("/app/campaigns");
	revalidatePath("/app/calendar");
	revalidatePath("/app/dashboard");
	redirect("/app/campaigns");
}

// ---- single-beat mutations (inspector pane) -------------------------------

const parseHashtags = (raw: string): string[] =>
	raw
		.split(/[\s,]+/)
		.map((t) => t.trim())
		.filter(Boolean)
		.map((t) => (t.startsWith("#") ? t : `#${t}`))
		.filter((t) => /^#[\w-]+$/.test(t))
		.slice(0, 20);

const parseKeyPoints = (raw: string): string[] =>
	raw
		.split("\n")
		.map((s) => s.trim())
		.filter(Boolean)
		.slice(0, 8);

export async function editBeatAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);

	const campaignId = String(formData.get("campaignId") ?? "");
	const beatId = String(formData.get("beatId") ?? "");
	if (!campaignId || !beatId) throw new Error("campaignId and beatId required");

	const patch: BeatEditPatch = {};
	const fields: ReadonlyArray<keyof BeatEditPatch> = [
		"title",
		"angle",
		"hook",
		"cta",
		"mediaSuggestion",
		"rationale",
	];
	for (const f of fields) {
		const raw = formData.get(f);
		if (raw === null) continue;
		const v = String(raw).trim();
		// Empty string is a valid clear for optional fields, but keep title/
		// angle non-empty when present.
		if ((f === "title" || f === "angle") && !v) continue;
		(patch as Record<string, unknown>)[f] = v;
	}
	const keyPointsRaw = formData.get("keyPoints");
	if (keyPointsRaw !== null) {
		patch.keyPoints = parseKeyPoints(String(keyPointsRaw));
	}
	const hashtagsRaw = formData.get("hashtags");
	if (hashtagsRaw !== null) {
		patch.hashtags = parseHashtags(String(hashtagsRaw));
	}

	await editCampaignBeat(ctx.user.id, campaignId, beatId, patch);

	revalidatePath(`/app/campaigns/${campaignId}`);
	redirect(`/app/campaigns/${campaignId}?beat=${beatId}`);
}

export async function changeBeatFormatAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);

	const campaignId = String(formData.get("campaignId") ?? "");
	const beatId = String(formData.get("beatId") ?? "");
	const format = String(formData.get("format") ?? "").trim();
	if (!campaignId || !beatId || !format) {
		throw new Error("campaignId, beatId, format required");
	}

	await changeCampaignBeatFormat(ctx.user.id, campaignId, beatId, format);

	revalidatePath(`/app/campaigns/${campaignId}`);
	redirect(`/app/campaigns/${campaignId}?beat=${beatId}`);
}

export async function rescheduleBeatAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);

	const campaignId = String(formData.get("campaignId") ?? "");
	const beatId = String(formData.get("beatId") ?? "");
	const date = String(formData.get("date") ?? "").trim();
	if (!campaignId || !beatId || !date) {
		throw new Error("campaignId, beatId, date required");
	}

	await rescheduleCampaignBeat(ctx.user.id, campaignId, beatId, date);

	revalidatePath(`/app/campaigns/${campaignId}`);
	redirect(`/app/campaigns/${campaignId}?beat=${beatId}`);
}

export async function deleteBeatAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);

	const campaignId = String(formData.get("campaignId") ?? "");
	const beatId = String(formData.get("beatId") ?? "");
	if (!campaignId || !beatId) throw new Error("campaignId and beatId required");

	await deleteCampaignBeat(ctx.user.id, campaignId, beatId);

	revalidatePath(`/app/campaigns/${campaignId}`);
	redirect(`/app/campaigns/${campaignId}`);
}

export async function addSiblingBeatAction(formData: FormData) {
	const ctx = await assertRole(ROLES.ADMIN);
	await requireMuseAccess(ctx.user.id);

	const campaignId = String(formData.get("campaignId") ?? "");
	const sourceBeatId = String(formData.get("sourceBeatId") ?? "");
	const targetFormat = String(formData.get("targetFormat") ?? "").trim();
	if (!campaignId || !sourceBeatId || !targetFormat) {
		throw new Error("campaignId, sourceBeatId, targetFormat required");
	}

	let newBeat: Awaited<ReturnType<typeof addSiblingBeat>>;
	try {
		newBeat = await addSiblingBeat(
			ctx.user.id,
			campaignId,
			sourceBeatId,
			targetFormat,
		);
	} catch (err) {
		if (err instanceof CostCapExceededError) throw err;
		throw err;
	}

	revalidatePath(`/app/campaigns/${campaignId}`);
	redirect(`/app/campaigns/${campaignId}?beat=${newBeat.id}`);
}
