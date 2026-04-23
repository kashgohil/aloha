ALTER TABLE "bluesky_credentials" DROP CONSTRAINT "bluesky_credentials_userId_unique";--> statement-breakpoint
ALTER TABLE "mastodon_credentials" DROP CONSTRAINT "mastodon_credentials_userId_unique";--> statement-breakpoint
ALTER TABLE "notion_credentials" DROP CONSTRAINT "notion_credentials_userId_unique";--> statement-breakpoint
ALTER TABLE "telegram_credentials" DROP CONSTRAINT "telegram_credentials_userId_unique";--> statement-breakpoint
DROP INDEX "inbox_sync_cursors_user_platform";--> statement-breakpoint
DROP INDEX "muse_enabled_channels_user_channel";--> statement-breakpoint
DROP INDEX "platform_content_cache_user_platform_remote";--> statement-breakpoint
DROP INDEX "platform_insights_user_platform_remote";--> statement-breakpoint
CREATE UNIQUE INDEX "inbox_sync_cursors_workspace_platform" ON "inbox_sync_cursors" USING btree ("workspaceId","platform");--> statement-breakpoint
CREATE UNIQUE INDEX "muse_enabled_channels_workspace_channel" ON "muse_enabled_channels" USING btree ("workspaceId","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_content_cache_workspace_platform_remote" ON "platform_content_cache" USING btree ("workspaceId","platform","remotePostId");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_insights_workspace_platform_remote" ON "platform_insights" USING btree ("workspaceId","platform","remotePostId");--> statement-breakpoint
ALTER TABLE "bluesky_credentials" ADD CONSTRAINT "bluesky_credentials_workspaceId_unique" UNIQUE("workspaceId");--> statement-breakpoint
ALTER TABLE "mastodon_credentials" ADD CONSTRAINT "mastodon_credentials_workspaceId_unique" UNIQUE("workspaceId");--> statement-breakpoint
ALTER TABLE "notion_credentials" ADD CONSTRAINT "notion_credentials_workspaceId_unique" UNIQUE("workspaceId");--> statement-breakpoint
ALTER TABLE "telegram_credentials" ADD CONSTRAINT "telegram_credentials_workspaceId_unique" UNIQUE("workspaceId");