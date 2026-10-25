CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"actor_id" uuid,
	"kind" text NOT NULL,
	"event_key" text NOT NULL,
	"post_id" uuid NOT NULL,
	"repost_id" uuid,
	"comment_id" uuid,
	"quote_comment_id" uuid,
	"read_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT clock_timestamp() NOT NULL,
	CONSTRAINT "notifications_event_key_unique" UNIQUE("event_key"),
	CONSTRAINT "notifications_kind_check" CHECK ("notifications"."kind" in ('REPORT_PROGRESS', 'REPORT_RESOLVED', 'COMMENT', 'REPLY'))
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_repost_id_community_reposts_id_fk" FOREIGN KEY ("repost_id") REFERENCES "public"."community_reposts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_id_community_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."community_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_quote_comment_id_community_quote_comments_id_fk" FOREIGN KEY ("quote_comment_id") REFERENCES "public"."community_quote_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at","id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id") WHERE "notifications"."read_at" is null;