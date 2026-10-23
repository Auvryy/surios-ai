ALTER TABLE "community_posts" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
