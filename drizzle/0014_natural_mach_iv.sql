CREATE TABLE "workspace_members" (
	"workspaceId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"invitedBy" uuid,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspaceId_userId_pk" PRIMARY KEY("workspaceId","userId")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"ownerUserId" uuid NOT NULL,
	"timezone" text,
	"role" text,
	"polarCustomerId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_polarCustomerId_unique" UNIQUE("polarCustomerId")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activeWorkspaceId" uuid;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invitedBy_users_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerUserId_users_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_members_user" ON "workspace_members" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_activeWorkspaceId_workspaces_id_fk" FOREIGN KEY ("activeWorkspaceId") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;