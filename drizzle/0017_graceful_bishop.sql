CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text NOT NULL,
	"kind" text NOT NULL,
	"channels" text[] DEFAULT '{}' NOT NULL,
	"rangeStart" timestamp NOT NULL,
	"rangeEnd" timestamp NOT NULL,
	"beats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"generationId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "campaignId" uuid;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_generationId_generations_id_fk" FOREIGN KEY ("generationId") REFERENCES "public"."generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;