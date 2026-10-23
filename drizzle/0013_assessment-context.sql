ALTER TABLE "community_drafts" ADD COLUMN "reporter_context" jsonb;--> statement-breakpoint
ALTER TABLE "community_drafts" ADD COLUMN "discarded_at" timestamp with time zone;