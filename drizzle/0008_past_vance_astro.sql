CREATE TABLE "ai_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"scheduledAt" timestamp,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lastError" text,
	"qstashMessageId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_voice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"tone" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"bannedPhrases" text[] DEFAULT '{}' NOT NULL,
	"ctaStyle" text,
	"emojiRate" text,
	"sampleSourceIds" text[] DEFAULT '{}' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"trainedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_voice_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "brand_voice_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"channel" text NOT NULL,
	"overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"feature" text NOT NULL,
	"templateName" text,
	"templateVersion" integer,
	"model" text NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tokensIn" integer DEFAULT 0 NOT NULL,
	"tokensOut" integer DEFAULT 0 NOT NULL,
	"costMicros" integer DEFAULT 0 NOT NULL,
	"latencyMs" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"errorCode" text,
	"errorMessage" text,
	"feedback" text,
	"feedbackAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "muse_enabled_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"channel" text NOT NULL,
	"enabledAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_content_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"platform" text NOT NULL,
	"remotePostId" text NOT NULL,
	"content" text NOT NULL,
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"platformData" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"platformPostedAt" timestamp,
	"fetchedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"platform" text NOT NULL,
	"remotePostId" text NOT NULL,
	"postId" uuid,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"platformPostedAt" timestamp,
	"fetchedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"version" integer NOT NULL,
	"systemPrompt" text NOT NULL,
	"inputSchema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"modelHint" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice" ADD CONSTRAINT "brand_voice_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_channels" ADD CONSTRAINT "brand_voice_channels_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "muse_enabled_channels" ADD CONSTRAINT "muse_enabled_channels_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_content_cache" ADD CONSTRAINT "platform_content_cache_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_insights" ADD CONSTRAINT "platform_insights_postId_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "brand_voice_channels_user_channel" ON "brand_voice_channels" USING btree ("userId","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "muse_enabled_channels_user_channel" ON "muse_enabled_channels" USING btree ("userId","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_content_cache_user_platform_remote" ON "platform_content_cache" USING btree ("userId","platform","remotePostId");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_insights_user_platform_remote" ON "platform_insights" USING btree ("userId","platform","remotePostId");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_templates_name_version" ON "prompt_templates" USING btree ("name","version");