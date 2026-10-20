CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_path" text NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"distress_type" text NOT NULL,
	"hazard_severity" integer NOT NULL,
	"risk_level" text NOT NULL,
	"vru_lethality" text NOT NULL,
	"vru_details" text,
	"recommended_action" text NOT NULL,
	"materials_checklist" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'REPORTED' NOT NULL,
	"community_confirmations" integer DEFAULT 1 NOT NULL,
	"resolved_image_path" text,
	"triage_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
