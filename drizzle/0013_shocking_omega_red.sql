CREATE TABLE "feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedId" uuid NOT NULL,
	"guid" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"url" text,
	"author" text,
	"imageUrl" text,
	"publishedAt" timestamp,
	"isRead" boolean DEFAULT false NOT NULL,
	"savedAsIdeaId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"url" text NOT NULL,
	"siteUrl" text,
	"title" text NOT NULL,
	"description" text,
	"iconUrl" text,
	"category" text,
	"lastFetchedAt" timestamp,
	"etag" text,
	"lastModified" text,
	"errorCount" integer DEFAULT 0 NOT NULL,
	"lastError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"source" text NOT NULL,
	"sourceId" text,
	"sourceUrl" text,
	"title" text,
	"body" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"channelFit" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_feedId_feeds_id_fk" FOREIGN KEY ("feedId") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "feed_items_feed_guid" ON "feed_items" USING btree ("feedId","guid");--> statement-breakpoint
CREATE UNIQUE INDEX "feeds_user_url" ON "feeds" USING btree ("userId","url");