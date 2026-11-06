CREATE TABLE "pending_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"department" text,
	"badge_number" text,
	"government_profile" jsonb,
	"code_hash" text NOT NULL,
	"code_salt" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 1 NOT NULL,
	"sent_window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_resets" ADD COLUMN "code_salt" text;--> statement-breakpoint
ALTER TABLE "password_resets" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pending_registrations_email_uidx" ON "pending_registrations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "pending_registrations_expires_idx" ON "pending_registrations" USING btree ("expires_at");