ALTER TABLE "links" ADD COLUMN "iconPresetId" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "templateId" text DEFAULT 'peach' NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "theme" jsonb;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "avatarAssetId" uuid;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "backgroundAssetId" uuid;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_avatarAssetId_assets_id_fk" FOREIGN KEY ("avatarAssetId") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_backgroundAssetId_assets_id_fk" FOREIGN KEY ("backgroundAssetId") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;