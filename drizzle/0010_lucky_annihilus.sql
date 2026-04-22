CREATE TABLE "internal_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actorId" uuid NOT NULL,
	"action" text NOT NULL,
	"targetUserId" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"passwordHash" text NOT NULL,
	"totpSecret" text,
	"totpEnrolledAt" timestamp,
	"role" text DEFAULT 'staff' NOT NULL,
	"lastLoginAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "internal_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "internal_audit_log" ADD CONSTRAINT "internal_audit_log_actorId_internal_users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."internal_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_audit_log" ADD CONSTRAINT "internal_audit_log_targetUserId_users_id_fk" FOREIGN KEY ("targetUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "internal_audit_log_actor_created" ON "internal_audit_log" USING btree ("actorId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "internal_audit_log_target_created" ON "internal_audit_log" USING btree ("targetUserId","createdAt" DESC NULLS LAST);