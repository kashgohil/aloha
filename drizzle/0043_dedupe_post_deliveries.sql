-- Collapse race-created duplicate post_deliveries rows.
-- Concurrent publishPost runs for the same post used to insert their
-- own row each (SELECT-then-INSERT had no unique-index guard), so a
-- post could end up with several (postId, platform) siblings. LinkedIn's
-- DUPLICATE_POST detection kept it from double-publishing, but the
-- failed siblings poisoned the post-status rollup ("Failed" on a post
-- that was actually live). Keep the row that actually shipped
-- (published + remotePostId wins, then any non-failed status, then the
-- oldest), delete the rest. The unique index follows in a separate
-- migration so this cleanup can complete first.
WITH ranked AS (
  SELECT
    "id",
    "postId",
    "platform",
    ROW_NUMBER() OVER (
      PARTITION BY "postId", "platform"
      ORDER BY
        CASE
          WHEN "status" = 'published' AND "remotePostId" IS NOT NULL THEN 0
          WHEN "status" = 'published' THEN 1
          WHEN "status" IN ('needs_reauth', 'pending_review', 'manual_assist') THEN 2
          WHEN "status" = 'pending' THEN 3
          WHEN "status" = 'failed' THEN 4
          ELSE 5
        END,
        "createdAt" ASC
    ) AS rn
  FROM "post_deliveries"
)
DELETE FROM "post_deliveries"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1)
  -- Belt-and-braces: never drop a row that actually shipped to the
  -- platform. The ORDER BY already ranks such rows first, so this only
  -- matters in the (vanishingly unlikely) case where the same
  -- (postId, platform) group has multiple live remote posts. In that
  -- case the unique-index migration that follows will fail and we'll
  -- resolve manually — far better than silently deleting a real
  -- publish record.
  AND NOT ("status" = 'published' AND "remotePostId" IS NOT NULL);
--> statement-breakpoint

-- Heal posts whose status got flipped to 'failed' by a losing concurrent
-- run even though a sibling delivery actually published. After the dedup
-- above, a post is 'published' iff any surviving delivery is 'published'.
UPDATE "posts" p
SET
  "status" = 'published',
  "publishedAt" = COALESCE(p."publishedAt", sub.earliest),
  "updatedAt" = NOW()
FROM (
  SELECT "postId", MIN("publishedAt") AS earliest
  FROM "post_deliveries"
  WHERE "status" = 'published'
  GROUP BY "postId"
) sub
WHERE p."id" = sub."postId"
  AND p."status" = 'failed';
