# Community posting

The community feed reads PostgreSQL records. Posts, comments, and confirmations survive refreshes; the old in-memory sample feed and preview publisher are removed.

## Posting flow

1. Open the posting prompt in `/community`, or choose an image / take a photo from the camera box in `/report`, sign in if needed, and enter a headline and description. Image selection on `/report` opens the shared composer with the selected files already attached. The camera action requests the rear camera on supporting mobile browsers and falls back to the native file picker elsewhere. `/report` uses the shared composer; the old dispatch introduction, fixed nearby-confirmation banner, and pitch-demo cards are removed. Publishing from `/report` opens the exact saved post in the feed.
2. Add up to six JPEG, PNG, WebP, MP4, WebM, or MOV attachments. Each file is limited to 10 MiB and the combined payload to 12 MiB.
3. Choose any attached photo or video as the cover. Main photos fill a consistent responsive 4:3 frame using `object-cover`. The full gallery uses `object-contain` for inspection.
4. Select **Assess with AI**. The server checks authentication, origin, upload limits, MIME signatures, and account assessment limits before sending all attachments to Gemini. Non-road evidence is rejected. Assessment errors preserve the local form for retry.
5. Review the distress classification, severity, rider risk, and suggested repair. The author can choose to use the AI summary in the description.
6. Name the road or landmark and select its exact position using the map, draggable pin, current location, or numeric coordinates. The initial map is centered on Santa Cruz; the author must confirm the actual site.
7. Publish. One transaction saves the community post and links it to a new or matching nearby road report. See [Road hazards](./ROAD_HAZARDS.md) for the grouping rules. Retrying a publish request for the same assessed draft returns the original post instead of duplicating the report.

Changing attachments invalidates the assessment; changing the cover among the already assessed attachments does not. Assessment drafts expire after 24 hours. Expired, unpublished draft uploads are cleaned on subsequent assessment requests. Published evidence is retained. Unsubmitted browser attachments are released when removed, published, or the component is destroyed.

AI severity and dimensions are estimates for triage, not certified measurements. The UI states that field inspection is needed. Gemini video/image input follows the [official media documentation](https://ai.google.dev/gemini-api/docs/video-understanding).

## Feed behavior

- The selected cover appears first; remaining photos and videos follow; the location map is always last.
- The right-hand vertical dock retains other attachments and the map tile. Previous/next controls and the expanded gallery expose every attachment, including videos.
- Search matches saved titles, descriptions, locations, contributor names, and readable distress categories. Multiple words can match different fields in any order; all meaningful words must match. Common English connective words (such as “near” and “the”) are ignored when other words are present. PostgreSQL English stemming matches forms such as “potholes”/“pothole” and “cracks”/“cracking”; literal substring matching supports partial names and local roads. This is deterministic database search, without fuzzy spelling correction or an external search API.
- Searches default to **Most relevant**: exact IDs and title phrases rank first, followed by weighted title, road/location, contributor, and description/category matches. Without a query, the feed defaults to **Newest first**. Users can explicitly choose newest, oldest, highest severity (saved AI assessment), or most confirmed (unique post confirmations). Equal scores use creation time and post ID for stable ordering. Critical and Confirmed are filters, separate from sorting.
- Exact post, linked-report, and assessment/draft IDs remain searchable, so evidence links reach older posts beyond the first batch. SQL parameters and escaped `%`, `_`, and backslash patterns keep user input literal. Punctuation-only queries produce no matches.
- The posting prompt and Photos/Video/Location shortcuts are hidden while text search or a contributor filter is active, including empty results. Clearing the search restores the composer and preserves media, severity/confirmation filters, and the selected sort. Posting remains available through Report a Hazard.
- Search, sort, media, contributor, critical, and confirmed filters are stored in the URL and work after refreshing. Changing a filter or sort resets pagination; loading more retains the current query and order. **Load more** adds batches of 20 up to 1,000 posts per filter; search queries the whole matching dataset rather than only the visible cards.
- Confirmations are unique per user/post. Setting a confirmation repeatedly is idempotent. The linked report deduplicates authors and confirmations across grouped posts; repeatedly confirming the same hazard does not inflate its priority.
- Comments and replies are authenticated, validated, saved, and rendered as text in full-page post threads. Replies retain a parent comment from the same post. Author names and pictures link to public profiles; the same post cards and interactions appear on profile pages. See [Community profiles](./COMMUNITY_PROFILES.md).
- `/liked` redirects to the signed-in user's saved confirmations.
- Guests can browse and search. Posting and interactions require sign-in.

## Post threads and reposts

A post has a permanent full-page thread at `/community/post/<post-id>`. Clicking the headline, main photo, attachment counter, or non-interactive blank space in a feed card opens that page. Profile links, confirmation/repost/share buttons, media controls, map controls and text selection keep their own behavior. Photo inspection uses the thread page instead of an image dialog. The main photo fills the feed frame; the thread uses `object-contain` for inspection, retaining supporting media and the map dock.

Each collapsed card shows at most one comment, including when comments have replies. The top preview is selected by saved unique comment likes, then reply count, then oldest creation time and ID for stable ties. A sole comment is shown directly. The full thread shows the complete discussion and supports authenticated comments, replies and comment likes. Repeated like requests are idempotent. These social interactions do not alter road evidence or hazard scores.

Signed-in users can repost a saved original post with optional text (up to 1,000 characters) and **at most one JPEG, PNG or WebP image, up to 4 MiB**. A plain repost needs no text or image. Repost images bypass Gemini because they are social attachments, not new road observations. The server checks authentication, request origin, image count, size, MIME signatures and source-post existence. The database also enforces the one-photo limit. Uploads stay on disk; PostgreSQL stores their metadata. A client request UUID makes retries idempotent. Owners can undo their own reposts; attachment files are removed with them.

Reposts are stored in `community_reposts`, separate from `community_posts`, `reports` and `report_observations`. Reposting never calls hazard recording or support refresh, never creates a map hazard, and never raises severity or community evidence support. Independent road posts still follow the existing same-location/evidence grouping rules in [Road hazards](./ROAD_HAZARDS.md). Comment likes use the unique `(comment_id, user_id)` key in `community_comment_likes`.

Originals and reposts share the feed and contributor profiles. Search can match repost text and its author's name as well as original-post fields. Pagination and sorting apply to the combined results; repost severity/confirmation sorting refers to the cited original, without adding a new assessment. A repost links back to its source thread, where original evidence and discussion remain available. Legacy `/community?q=<post-id>#post-<post-id>` links remain supported.

## Database and deployment

Apply the additive migrations before starting the updated application (0003 follows 0002; see [Road hazards](./ROAD_HAZARDS.md#upgrade)):

```bash
docker compose exec -T surios-db psql -U postgres -d surios -v ON_ERROR_STOP=1 -1 < drizzle/0002_community-posting.sql
```

For a database managed with Drizzle's migration journal, use your normal migration runner instead of applying the same SQL twice. `npm run db:push` remains the existing local schema-sync alternative.

Production, when the earlier migrations are already applied:

```bash
docker compose -f docker-compose.prod.yml exec -T db psql -U postgres -d surios -v ON_ERROR_STOP=1 -1 < drizzle/0002_community-posting.sql
```

The migration tolerates an existing `users.settings` column from earlier `db:push` usage. New tables are `community_drafts`, `community_posts`, `community_confirmations`, and `community_comments`.

Media is stored under `static/uploads/community`, with metadata only in PostgreSQL. `/media/[name]` serves uploads at runtime, including HTTP byte ranges for video playback/seeking. The production uploads volume now mounts at `/app/static/uploads`, matching the actual writer, and `BODY_SIZE_LIMIT=16M` permits the bounded multipart request. A pre-existing volume mounted at `/app/uploads` should be backed up and its contents checked before relocating it; the new mount does not migrate container-local legacy uploads automatically.

The account assessment limit is 12 successful assessment drafts per hour, with one active assessment per account in a single process. For multiple application replicas, use shared rate limiting and shared media storage.

## Verification

```bash
npm run check
npm run build
npx playwright install chromium
npm run test:community
```

The browser suite uses a local database and the seeded citizen account. It starts a separate dev server on port 5177, creates uniquely identified records and media, and removes its fixtures afterwards. Set `DATABASE_URL` for an isolated test database when needed; apply the schema and seed the demo account there first. Tests do not need a Gemini key or spend API credits.

Coverage includes:

- Authentication, origin checks, invalid input, and mismatched upload signatures.
- Multi-attachment composition, photo/video cover selection, publication, reload persistence, linked reports, and duplicate-publish protection.
- Saved confirmations and comments, server search and filters, HTTP range requests, native video playback, map-last navigation, map pin placement, and geolocation.
- Responsive frames and no horizontal overflow at 320, 375, 768, and 1440 pixels.
- Assessment failure preserving attachments and cover fallback after removing an attachment.

The browser flow uses an explicitly controlled AI response backed by a real database draft. It does not prove model accuracy. Live Gemini image and mixed image/video calls must be checked separately with configured credentials and representative road evidence.

## Focused search verification

```bash
npx playwright test --config playwright.search.config.ts
```

This suite reserves port 5187, disables outbound email, and creates uniquely identified temporary users, posts, confirmations, and one report in the configured local database, removing only those fixtures afterward. It covers multiword matching, weighted relevance, English stemming, literal wildcard handling, evidence IDs, all sort modes, combined filters, stable pagination, URL persistence, composer visibility, native search submission, and responsive widths. It does not require Gemini credentials.

## Social upgrade

After applying government migration `0006_government-work-orders.sql`, apply additive `0007_community-social.sql` before serving this version. It creates only `community_reposts`, `community_comment_likes` and their constraints/indexes; existing reports, severity, source observations and posts are retained.

```bash
docker compose exec -T surios-db psql -U postgres -d surios -v ON_ERROR_STOP=1 -1 < drizzle/0007_community-social.sql
```

Use the deployment's normal journaled migration runner instead when that runner manages the database; do not apply the same migration twice. Drizzle configuration includes both the base schema and `community-social-schema.ts`, so future generated migrations retain both government and citizen tables.

## Social and thread verification

```bash
npx playwright test --config playwright.social.config.ts
```

The focused suite runs search and social/thread tests on port 5187 with outbound email disabled. Use a schema-ready `DATABASE_URL`; uniquely identified fixture records and uploaded repost images are removed afterward. Coverage includes full-page/blank-space/media navigation, one popular or sole comment preview, persisted comment likes, plain and image reposts, feed/search/profile visibility, owner-only undo, idempotent retries, upload limits and unchanged hazard evidence/support/severity.
