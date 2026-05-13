-- Heal deliveries that hold a live remote post but were stamped 'failed'
-- by a concurrent run. Background: until the failure update was guarded
-- against an already-`published` status, two simultaneous publishPost
-- runs could share the same delivery row. Run #1 would publish and set
-- (status='published', remotePostId, remoteUrl); run #2's request would
-- then come back from the platform with DUPLICATE_POST and overwrite
-- status to 'failed' (without unsetting the remote fields). The row
-- still points at the live remote post, so flip it back to 'published'.
UPDATE "post_deliveries"
SET
  "status" = 'published',
  "errorCode" = NULL,
  "errorMessage" = NULL,
  "updatedAt" = NOW()
WHERE "status" = 'failed'
  AND "remotePostId" IS NOT NULL;
--> statement-breakpoint

-- Re-roll any post sitting at 'failed' whose surviving delivery is now
-- 'published' after the heal above.
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
