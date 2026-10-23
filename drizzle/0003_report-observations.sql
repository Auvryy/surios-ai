CREATE TABLE "report_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"user_id" uuid,
	"observer_key" text NOT NULL,
	"analysis" jsonb NOT NULL,
	"media" jsonb NOT NULL,
	"fingerprints" jsonb NOT NULL,
	"match" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_observations_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
ALTER TABLE "report_observations" ADD CONSTRAINT "report_observations_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_observations" ADD CONSTRAINT "report_observations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_observations_report_idx" ON "report_observations" USING btree ("report_id");
--> statement-breakpoint
UPDATE reports SET triage_payload = COALESCE(triage_payload, '{}'::jsonb) || jsonb_build_object('supportBaseline', CASE WHEN EXISTS (SELECT 1 FROM community_posts p WHERE p.report_id = reports.id) THEN 0 ELSE community_confirmations END);
--> statement-breakpoint
INSERT INTO report_observations (report_id, source_id, user_id, observer_key, analysis, media, fingerprints, match, created_at)
SELECT report_id, draft_id, user_id, 'user:' || user_id::text, analysis, media, '[]'::jsonb, '{"method":"legacy","confidence":1,"reason":"Existing published observation; preserved during upgrade."}'::jsonb, created_at FROM community_posts;
