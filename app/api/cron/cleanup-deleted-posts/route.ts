import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import { env } from "@/lib/env";

/**
 * Cleanup job to permanently delete posts that have been in "deleted" status
 * for more than 30 days.
 *
 * This can be triggered by:
 * 1. Vercel Cron (recommended): Configure in vercel.json
 * 2. Manual trigger: Call with ?key=<CRON_SECRET>
 *
 * Returns stats about deleted posts.
 */
export async function GET(req: NextRequest) {
	// Verify authorization
	const { searchParams } = new URL(req.url);
	const key = searchParams.get("key");

	// Check for cron secret from header (Vercel Cron) or query param (manual)
	const cronSecret = env.CRON_SECRET;
	if (key !== cronSecret) {
		return NextResponse.json(
			{ error: "Unauthorized" },
			{ status: 401 },
		);
	}

	try {
		// Calculate the cutoff date (30 days ago)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// Find posts to delete (status = "deleted" AND deletedAt < 30 days ago)
		const postsToDelete = await db
			.select({
				id: posts.id,
				userId: posts.userId,
				deletedAt: posts.deletedAt,
			})
			.from(posts)
			.where(
				and(
					eq(posts.status, "deleted"),
					lt(posts.deletedAt, thirtyDaysAgo),
				),
			);

		if (postsToDelete.length === 0) {
			return NextResponse.json({
				success: true,
				deleted: 0,
				cutoff: thirtyDaysAgo.toISOString(),
				message: "No posts to clean up",
			});
		}

		// Extract IDs for batch deletion
		const idsToDelete = postsToDelete.map((p) => p.id);

		// Perform the deletion (cascades to post_deliveries via FK)
		const result = await db
			.delete(posts)
			.where(
				sql`${posts.id} IN (${sql.join(idsToDelete.map((id) => sql`${id}`), sql`, `)})`,
			);

		return NextResponse.json({
			success: true,
			deleted: postsToDelete.length,
			cutoff: thirtyDaysAgo.toISOString(),
			postIds: idsToDelete,
			message: `Permanently deleted ${postsToDelete.length} posts older than 30 days`,
		});
	} catch (error) {
		console.error("Cleanup job failed:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/**
 * POST endpoint for cleanup - same as GET for flexibility
 */
export async function POST(req: NextRequest) {
	return GET(req);
}
