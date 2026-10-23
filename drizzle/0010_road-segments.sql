ALTER TABLE "community_posts" ADD COLUMN "road_segment" jsonb;
--> statement-breakpoint
UPDATE reports r SET community_confirmations = greatest(1,
 coalesce((r.triage_payload->>'supportBaseline')::int, 0) +
 (SELECT count(DISTINCT observer_key)::int FROM report_observations o WHERE o.report_id = r.id));
