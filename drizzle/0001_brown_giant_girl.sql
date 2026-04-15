CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"polarSubscriptionId" text NOT NULL,
	"productKey" text NOT NULL,
	"status" text NOT NULL,
	"interval" text NOT NULL,
	"seats" integer DEFAULT 1 NOT NULL,
	"currentPeriodEnd" timestamp,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_polarSubscriptionId_unique" UNIQUE("polarSubscriptionId")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "polarCustomerId" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_polarCustomerId_unique" UNIQUE("polarCustomerId");