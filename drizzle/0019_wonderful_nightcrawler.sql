ALTER TABLE "assets" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "automations" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "brand_corpus" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "broadcasts" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "campaigns" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "ideas" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "pages" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "posts" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "sending_domains" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "subscribers" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "userId" TO "createdByUserId";--> statement-breakpoint
ALTER TABLE "pages" DROP CONSTRAINT "pages_userId_unique";--> statement-breakpoint
ALTER TABLE "assets" DROP CONSTRAINT "assets_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "automations" DROP CONSTRAINT "automations_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "brand_corpus" DROP CONSTRAINT "brand_corpus_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "broadcasts" DROP CONSTRAINT "broadcasts_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "ideas" DROP CONSTRAINT "ideas_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "pages" DROP CONSTRAINT "pages_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sending_domains" DROP CONSTRAINT "sending_domains_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subscribers" DROP CONSTRAINT "subscribers_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX "brand_corpus_user_source_sourceid";--> statement-breakpoint
DROP INDEX "sending_domains_user_domain";--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_corpus" ADD CONSTRAINT "brand_corpus_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sending_domains" ADD CONSTRAINT "sending_domains_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "brand_corpus_workspace_source_sourceid" ON "brand_corpus" USING btree ("workspaceId","source","sourceId");--> statement-breakpoint
CREATE UNIQUE INDEX "sending_domains_user_domain" ON "sending_domains" USING btree ("createdByUserId","domain");--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_createdByUserId_unique" UNIQUE("createdByUserId");