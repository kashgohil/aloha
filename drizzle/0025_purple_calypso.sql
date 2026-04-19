ALTER TABLE "sending_domains" ADD COLUMN "openTracking" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sending_domains" ADD COLUMN "clickTracking" boolean DEFAULT false NOT NULL;