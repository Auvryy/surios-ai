CREATE TABLE "government_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"media" jsonb NOT NULL,
	"claimed_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_quote_comment_likes" (
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_quote_comment_likes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "community_quote_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repost_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_quote_likes" (
	"repost_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_quote_likes_repost_id_user_id_pk" PRIMARY KEY("repost_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "community_reposts" ADD COLUMN "quoted_repost_id" uuid;--> statement-breakpoint
ALTER TABLE "government_media" ADD CONSTRAINT "government_media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_media" ADD CONSTRAINT "government_media_claimed_by_community_reposts_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."community_reposts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_quote_comment_likes" ADD CONSTRAINT "community_quote_comment_likes_comment_id_community_quote_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."community_quote_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_quote_comment_likes" ADD CONSTRAINT "community_quote_comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_quote_comments" ADD CONSTRAINT "community_quote_comments_repost_id_community_reposts_id_fk" FOREIGN KEY ("repost_id") REFERENCES "public"."community_reposts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_quote_comments" ADD CONSTRAINT "community_quote_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_quote_comments" ADD CONSTRAINT "community_quote_comments_parent_id_community_quote_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_quote_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_quote_likes" ADD CONSTRAINT "community_quote_likes_repost_id_community_reposts_id_fk" FOREIGN KEY ("repost_id") REFERENCES "public"."community_reposts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_quote_likes" ADD CONSTRAINT "community_quote_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "government_media_expiry_idx" ON "government_media" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "community_quote_comments_repost_idx" ON "community_quote_comments" USING btree ("repost_id");--> statement-breakpoint
ALTER TABLE "community_reposts" ADD CONSTRAINT "community_reposts_quoted_repost_id_community_reposts_id_fk" FOREIGN KEY ("quoted_repost_id") REFERENCES "public"."community_reposts"("id") ON DELETE set null ON UPDATE no action;