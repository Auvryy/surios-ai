# Road hazards

`/` opens `/community` for guests, citizens, and municipal accounts. The map is `/map`, labelled **Road hazards**. Existing root links containing `report`, `incident`, `highlight`, or `id` redirect to the matching map report. Authentication respects a requested internal destination; its default destination is the feed.

## Map interface

- The global sidebar collapses to an icon rail. Its state is stored in the `surios_nav` preference cookie and restored on reload. Mobile navigation remains a drawer.
- The map fills the available viewport. Resizing the sidebar invalidates Leaflet's size without resetting the user's view.
- Floating chips open the report list, filters/sort, layers, fit-visible action, refresh, and legend. Their panels can close again, leaving the map visible.
- List entries show one thumbnail, title, severity, location, status, support, and evidence count. Selecting a pin opens a compact preview; **More details** reveals the AI summary, proposed repair, grouping reasons, and links to related posts.
- Search, status, damage type, critical severity, and rider-risk filters affect both pins and the list. Sort choices are priority, severity, newest, and support.
- Overlapping pins are grouped visually by a 42-pixel map grid. The corner count means **separate hazards overlap on screen**. Clicking that pin opens those hazards in the list. Visual clustering never merges database reports.
- Data comes only from stored reports. Demo incidents, invented corridor PCI scores, and fabricated road-condition line colours are removed. Reference road outlines are neutral, optional context.
- Visible maps refresh every 30 seconds and when the browser regains focus. Manual refresh is also available. An update failure keeps the last loaded data and shows an error.
- Directions reuse the road-routing service. If the service cannot return a road route, the fallback is explicitly a dashed direct connection without invented turns or travel time.

## A post becomes a map pin

1. The author selects photos/videos and a precise location.
2. Gemini assesses the evidence; non-infrastructure is rejected. The server normalizes the assessment into consistent severity/risk bands.
3. On publishing, the server looks for up to three nearest open reports of the **same distress type within 25 metres** of the submitted pin. The bounding-box query is followed by an exact Haversine check. The canonical pin stays fixed, preventing groups from drifting through chains of nearby reports.
4. Matching evidence is linked to one canonical report. Otherwise, a new report is created at the submitted coordinates. Every community post remains independently visible in the feed.
5. The post, observation, and report update commit in one database transaction. The map reads that canonical report, and the post links directly to `/map?report=<uuid>`.

The legacy `/api/triage` field-capture endpoint uses the same grouping logic and runtime media storage. It validates coordinates and preserves the submitted pin; reverse geocoding may supply an address but does not silently move the pin to a street centreline. A failed save no longer returns a successful pending ticket.

## How matching works

Proximity or a common word such as “pothole” is not enough to establish identity.

- **Exact shared evidence:** SHA-256 hashes match previously saved media, with the same damage type and nearby coordinates. This groups without another model request.
- **Different views:** Gemini compares the new evidence with available candidate imagery. It checks defect geometry, lane markings, edges, and landmarks. A selected ID must be one of the supplied candidates, have visual evidence, and have model confidence at least **0.85**.
- **Uncertain, unavailable, or low-confidence comparison:** create a separate report. Audit metadata states why it was kept separate. Files unavailable for comparison are never treated as a confirmed match.
- **Different category, more than 25 metres away, or resolved report:** keep a separate report. A fresh defect at a repaired location does not reopen a resolved report automatically.

The confidence value is the model's judgement, not a calibrated probability or proof. Similar nearby defects can still be misidentified; the audit reason and original posts remain available for inspection. Existing historical field reports are preserved rather than retroactively merged without evidence.

## Severity, support, and priority are different

### Severity: assessed damage/rider hazard, 1–10

The raw AI score is normalized using conservative product rules:

- Risk floors: LOW → 1, MODERATE → 4, CRITICAL → 8.
- Rider-risk floors: NONE/LOW → 1, MODERATE → 4, HIGH → 6, CRITICAL → 8.
- Final score = maximum of the AI score and both floors, bounded to 1–10.
- Display bands: 1–3 LOW, 4–7 MODERATE, 8–10 CRITICAL.

This prevents contradictory labels such as severity 1 with critical rider risk. These are **SuriOS triage rules**, not a calculated or certified ASTM Pavement Condition Index. Image-based dimensions remain estimates requiring field inspection.

For a matched open report, genuinely new media may raise its severity to the higher normalized assessment. Reusing only already known media cannot raise severity because a second model call happened to score the same image differently. The highest observed rider risk is retained; automatic grouping does not downgrade a report. Resolution and verified reinspection are separate municipal workflows.

### Support: distinct participants, not number of likes/posts

For each canonical report, take the union of:

- `user:<uuid>` for authored observations;
- `user:<uuid>` for confirmations across all posts linked to the report;
- a stable media fingerprint key for signed-out field observations.

A signed-in author posting repeatedly, confirming their own post, or confirming several posts in the same group counts once. Historical field totals with no participant records are retained as a documented baseline; their original identities cannot be reconstructed.

### Priority: severity plus a bounded support signal

```text
priority = min(10, severity + min(2, 0.25 × max(0, support − 1)))
```

Example: severity 5 with one supporter has priority 5.00. Two supporters make priority 5.25 while severity stays 5. Even 100 supporters add at most 2 points. The map defaults to sorting by priority; severity-only sorting remains available.

## Persistence and concurrency

`report_observations` records a unique source ID, canonical report ID, participant key, media, hashes, normalized assessment, match method, model confidence, and reason. Existing community posts are backfilled as observations during migration.

Visual comparison happens outside the write transaction. Publishing then takes a short database advisory lock, rechecks the candidate set, and retries comparison if nearby reports changed. This avoids two concurrent submissions creating duplicates simply because neither originally saw the other. Draft ownership, expiry, and existing publications are checked before optional AI comparison and rechecked in the transaction. A source ID is unique, so retrying a completed request does not duplicate evidence, support, posts, or reports.

Confirmations use the same write lock and recompute support across the canonical report, not just the currently liked post. Severity does not change when support changes.

## Upgrade

Apply migration 0003 after 0002:

```bash
docker compose exec -T surios-db psql -U postgres -d surios -v ON_ERROR_STOP=1 -1 < drizzle/0003_report-observations.sql
```

Use the normal migration runner instead for databases managed by Drizzle's migration journal. The migration preserves existing report metadata, backfills published observations, retains anonymous legacy support baselines, and recomputes unique support for existing community posts. It does not merge or delete historical reports.

## Verification

```bash
npm run check
npm run build
npm run test:community
```

The suite covers severity normalization, bounded priority, repeated evidence, unique support, confident visual-match decisions, uncertain matches, distance/category/resolved exclusions, concurrent publication, feed-first navigation, persistent sidebar collapse, floating controls, sorting, filters, map deep links, and responsive viewport fit. Existing posting/media/comment tests remain in place.

Automated grouping tests inject controlled visual decisions and use isolated database fixtures. They make no paid model calls. A separate live Gemini check confirmed matching road imagery; it does not establish model accuracy across all real-world scenes.
