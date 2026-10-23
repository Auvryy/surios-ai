# Community posting

The community feed reads PostgreSQL records. Posts, comments, and confirmations survive refreshes; the old in-memory sample feed and preview publisher are removed.

## Posting flow

1. Sign in, open the community composer, and enter a headline and description.
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
- Search matches saved titles, descriptions, locations, contributor names, distress categories, and post/report IDs. Shared links search by post ID so older posts remain reachable beyond the first batch. Literal `%`, `_`, and backslash characters are escaped before SQL pattern matching.
- Search, media, contributor, critical, and confirmed filters are stored in the URL and work after refreshing. **Load more** adds batches of 20 up to 1,000 posts per filter; search queries the whole matching dataset rather than only the visible cards.
- Confirmations are unique per user/post. Setting a confirmation repeatedly is idempotent. The linked report deduplicates authors and confirmations across grouped posts; repeatedly confirming the same hazard does not inflate its priority.
- Comments are authenticated, validated, saved, and rendered as text.
- `/liked` redirects to the signed-in user's saved confirmations.
- Guests can browse and search. Posting and interactions require sign-in.

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
