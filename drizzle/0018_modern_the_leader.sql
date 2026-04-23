ALTER TABLE "brand_voice" DROP CONSTRAINT "brand_voice_userId_unique";--> statement-breakpoint
ALTER TABLE "brand_voice" DROP CONSTRAINT "brand_voice_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "brand_voice_channels" DROP CONSTRAINT "brand_voice_channels_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "channel_profiles" DROP CONSTRAINT "channel_profiles_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "channel_states" DROP CONSTRAINT "channel_states_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feeds" DROP CONSTRAINT "feeds_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX "brand_voice_channels_user_channel";--> statement-breakpoint
DROP INDEX "channel_profiles_user_channel";--> statement-breakpoint
DROP INDEX "channel_states_user_channel";--> statement-breakpoint
DROP INDEX "feeds_user_url";--> statement-breakpoint
CREATE UNIQUE INDEX "brand_voice_channels_workspace_channel" ON "brand_voice_channels" USING btree ("workspaceId","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "channel_profiles_workspace_channel" ON "channel_profiles" USING btree ("workspaceId","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "channel_states_workspace_channel" ON "channel_states" USING btree ("workspaceId","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "feeds_workspace_url" ON "feeds" USING btree ("workspaceId","url");--> statement-breakpoint
ALTER TABLE "brand_voice" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "brand_voice_channels" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "channel_profiles" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "channel_states" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "brand_voice" ADD CONSTRAINT "brand_voice_workspaceId_unique" UNIQUE("workspaceId");