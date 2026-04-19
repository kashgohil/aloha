ALTER TABLE "users" ADD COLUMN "notifyPostOutcomes" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifyInboxSyncIssues" boolean DEFAULT true NOT NULL;