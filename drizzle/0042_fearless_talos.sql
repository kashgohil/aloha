-- Fold studio_mode + studio_payload into channelContent[<channel>] = { form, payload, ... }
-- Existing channelContent overrides for the same channel (if any) are preserved
-- via the jsonb || merge operator.
UPDATE "posts"
SET "channelContent" = "channelContent" || jsonb_build_object(
  studio_mode->>'channel',
  COALESCE("channelContent"->(studio_mode->>'channel'), '{}'::jsonb) || jsonb_build_object(
    'form', studio_mode->>'form',
    'payload', COALESCE(studio_payload, '{}'::jsonb)
  )
)
WHERE studio_mode IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "studio_mode";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "studio_payload";
