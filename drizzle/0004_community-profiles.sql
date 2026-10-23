ALTER TABLE "community_comments" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parent_id_community_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_comments"("id") ON DELETE cascade ON UPDATE no action;