ALTER TABLE "bluesky_credentials" DROP CONSTRAINT "bluesky_credentials_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "inbox_messages" DROP CONSTRAINT "inbox_messages_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "inbox_sync_cursors" DROP CONSTRAINT "inbox_sync_cursors_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "mastodon_credentials" DROP CONSTRAINT "mastodon_credentials_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "muse_enabled_channels" DROP CONSTRAINT "muse_enabled_channels_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notion_credentials" DROP CONSTRAINT "notion_credentials_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "platform_content_cache" DROP CONSTRAINT "platform_content_cache_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "platform_insights" DROP CONSTRAINT "platform_insights_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "post_comments" DROP CONSTRAINT "post_comments_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "telegram_credentials" DROP CONSTRAINT "telegram_credentials_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX "inbox_messages_user_platform_remote";--> statement-breakpoint
DROP INDEX "post_comments_user_platform_remote";--> statement-breakpoint
DROP INDEX "post_comments_user_platform_root";--> statement-breakpoint
CREATE UNIQUE INDEX "inbox_messages_workspace_platform_remote" ON "inbox_messages" USING btree ("workspaceId","platform","remoteId");--> statement-breakpoint
CREATE UNIQUE INDEX "post_comments_workspace_platform_remote" ON "post_comments" USING btree ("workspaceId","platform","remoteId");--> statement-breakpoint
CREATE INDEX "post_comments_workspace_platform_root" ON "post_comments" USING btree ("workspaceId","platform","rootRemoteId");--> statement-breakpoint
ALTER TABLE "bluesky_credentials" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "inbox_messages" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "inbox_sync_cursors" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "mastodon_credentials" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "muse_enabled_channels" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "notion_credentials" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "platform_content_cache" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "platform_insights" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "post_comments" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "telegram_credentials" DROP COLUMN "userId";