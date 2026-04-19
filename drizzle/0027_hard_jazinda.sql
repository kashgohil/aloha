CREATE TABLE "telegram_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"botToken" text NOT NULL,
	"chatId" text NOT NULL,
	"username" text,
	"reauthRequired" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_credentials_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "automation_runs" ADD COLUMN "resumeAt" timestamp;--> statement-breakpoint
ALTER TABLE "automation_runs" ADD COLUMN "cursor" text;--> statement-breakpoint
ALTER TABLE "automation_runs" ADD COLUMN "snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "automations" ADD COLUMN "nextFireAt" timestamp;--> statement-breakpoint
ALTER TABLE "telegram_credentials" ADD CONSTRAINT "telegram_credentials_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_runs_resume_idx" ON "automation_runs" USING btree ("status","resumeAt");--> statement-breakpoint
CREATE INDEX "automations_next_fire_idx" ON "automations" USING btree ("status","nextFireAt");