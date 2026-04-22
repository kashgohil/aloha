CREATE TABLE "post_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"platform" text NOT NULL,
	"remoteId" text NOT NULL,
	"parentRemoteId" text NOT NULL,
	"rootRemoteId" text NOT NULL,
	"authorDid" text,
	"authorHandle" text NOT NULL,
	"authorDisplayName" text,
	"authorAvatarUrl" text,
	"content" text NOT NULL,
	"platformData" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"platformCreatedAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_engagement_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deliveryId" uuid NOT NULL,
	"capturedAt" timestamp DEFAULT now() NOT NULL,
	"likes" integer,
	"reposts" integer,
	"replies" integer,
	"views" integer,
	"bookmarks" integer,
	"profileClicks" integer
);
--> statement-breakpoint
CREATE TABLE "post_sync_cursors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deliveryId" uuid NOT NULL,
	"kind" text NOT NULL,
	"cursor" text,
	"lastSyncedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_engagement_snapshots" ADD CONSTRAINT "post_engagement_snapshots_deliveryId_post_deliveries_id_fk" FOREIGN KEY ("deliveryId") REFERENCES "public"."post_deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_sync_cursors" ADD CONSTRAINT "post_sync_cursors_deliveryId_post_deliveries_id_fk" FOREIGN KEY ("deliveryId") REFERENCES "public"."post_deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_comments_user_platform_remote" ON "post_comments" USING btree ("userId","platform","remoteId");--> statement-breakpoint
CREATE INDEX "post_comments_user_platform_root" ON "post_comments" USING btree ("userId","platform","rootRemoteId");--> statement-breakpoint
CREATE INDEX "post_engagement_snapshots_delivery_captured" ON "post_engagement_snapshots" USING btree ("deliveryId","capturedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "post_sync_cursors_delivery_kind" ON "post_sync_cursors" USING btree ("deliveryId","kind");