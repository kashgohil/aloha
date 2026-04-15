CREATE TABLE IF NOT EXISTS "bluesky_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
	"handle" text NOT NULL,
	"app_password" text NOT NULL,
	"did" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
