ALTER TABLE "notion_credentials" RENAME COLUMN "workspaceId" TO "notionWorkspaceId";--> statement-breakpoint
ALTER TABLE "notion_credentials" RENAME COLUMN "workspaceName" TO "notionWorkspaceName";--> statement-breakpoint
ALTER TABLE "notion_credentials" RENAME COLUMN "workspaceIcon" TO "notionWorkspaceIcon";--> statement-breakpoint
ALTER TABLE "notion_credentials" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "automations" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "bluesky_credentials" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "brand_corpus" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "brand_voice" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "brand_voice_channels" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "channel_notifications" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "channel_profiles" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "channel_states" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "feature_access" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "generations" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "ideas" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "inbox_messages" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "inbox_sync_cursors" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "mastodon_credentials" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "muse_enabled_channels" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "platform_content_cache" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "post_comments" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "sending_domains" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "telegram_credentials" ADD COLUMN "workspaceId" uuid;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bluesky_credentials" ADD CONSTRAINT "bluesky_credentials_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_corpus" ADD CONSTRAINT "brand_corpus_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice" ADD CONSTRAINT "brand_voice_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_channels" ADD CONSTRAINT "brand_voice_channels_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_notifications" ADD CONSTRAINT "channel_notifications_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_profiles" ADD CONSTRAINT "channel_profiles_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_states" ADD CONSTRAINT "channel_states_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_access" ADD CONSTRAINT "feature_access_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_sync_cursors" ADD CONSTRAINT "inbox_sync_cursors_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastodon_credentials" ADD CONSTRAINT "mastodon_credentials_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "muse_enabled_channels" ADD CONSTRAINT "muse_enabled_channels_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_credentials" ADD CONSTRAINT "notion_credentials_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_content_cache" ADD CONSTRAINT "platform_content_cache_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sending_domains" ADD CONSTRAINT "sending_domains_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_credentials" ADD CONSTRAINT "telegram_credentials_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;