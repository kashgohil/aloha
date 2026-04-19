CREATE TABLE "automation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automationId" uuid NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"trigger" jsonb,
	"stepResults" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"finishedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "automations" ADD COLUMN "config" jsonb;--> statement-breakpoint
ALTER TABLE "automations" ADD COLUMN "steps" jsonb;--> statement-breakpoint
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_automationId_automations_id_fk" FOREIGN KEY ("automationId") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_runs_automation_started_idx" ON "automation_runs" USING btree ("automationId","startedAt" DESC NULLS LAST);