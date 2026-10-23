CREATE TABLE "community_comment_likes" (
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_comment_likes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "community_reposts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_reposts_one_photo" CHECK (jsonb_typeof("community_reposts"."media") = 'array' and jsonb_array_length("community_reposts"."media") <= 1 and (jsonb_array_length("community_reposts"."media") = 0 or coalesce("community_reposts"."media"->0->>'kind', '') = 'photo'))
);
--> statement-breakpoint
ALTER TABLE "community_comment_likes" ADD CONSTRAINT "community_comment_likes_comment_id_community_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."community_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comment_likes" ADD CONSTRAINT "community_comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_reposts" ADD CONSTRAINT "community_reposts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_reposts" ADD CONSTRAINT "community_reposts_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_reposts_created_idx" ON "community_reposts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "community_reposts_post_idx" ON "community_reposts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "community_reposts_user_idx" ON "community_reposts" USING btree ("user_id");