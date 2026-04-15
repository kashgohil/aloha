ALTER TABLE "posts" ADD COLUMN "channelContent" jsonb DEFAULT '{}'::jsonb NOT NULL;
