CREATE TABLE "content_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"goal" text NOT NULL,
	"themes" text[] DEFAULT '{}' NOT NULL,
	"channels" text[] DEFAULT '{}' NOT NULL,
	"frequency" integer NOT NULL,
	"rangeStart" timestamp NOT NULL,
	"rangeEnd" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"ideas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generationId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_generationId_generations_id_fk" FOREIGN KEY ("generationId") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;