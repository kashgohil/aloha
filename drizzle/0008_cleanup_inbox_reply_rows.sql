-- Phase 2: inbox_messages no longer holds replies. Rows with reason='reply'
-- are replaced by post_comments entries written by the new fetcher split.
-- Drop any that were captured under the old scheme. This is safe because
-- the fetcher will re-insert them (now as comments, with proper root/parent
-- anchors) on the next sync run.
DELETE FROM "inbox_messages" WHERE "reason" = 'reply';
