DROP TABLE "content_plans" CASCADE;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "themes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "postsPerWeek" integer;