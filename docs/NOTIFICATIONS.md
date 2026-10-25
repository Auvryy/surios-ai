# Saved in-app notifications

The existing backend now records a private notification inbox for web/native API clients. The mobile Updates tab consumes it. This change does not add a website inbox screen, phone push delivery, email requirements or a separate database/service.

## Recipients and event creation

| Event | Recipients | Destination |
| --- | --- | --- |
| Official `IN_PROGRESS` or `RESOLVED` update | Distinct authors of active posts with the same canonical report ID | The actual official update and its source post, even when another linked post belongs to the recipient |
| Source-post comment | Source-post author | Source discussion |
| Government/social-update comment | Update author | Update discussion |
| Reply in either discussion | Parent-comment author and post/update author, deduplicated | Corresponding source/update discussion |

The actor never receives a self-notification. A reply to the post author's own comment produces one reply event for that author. Nearby unrelated reports are not recipients. No event is emitted for rejected mutations, ordinary reactions or social repost creation. A new official update is a new event, including a deliberate reopening or follow-up at the same status.

`community-social.ts` saves official updates, canonical status, audit events and notifications in one database transaction under the existing report lock. Retrying the same official-update UUID returns the saved update and does not add notifications. Source and quote comments save their notifications in the same transaction as the comment. Notification creation uses a unique event/recipient key.

Existing email preferences and delivery stay independent. Disabling email, or leaving SMTP unconfigured, does not disable the saved inbox. Notifications do not modify severity, support, grouping, priority or hazard status. Only new actions after this feature is deployed create receipts; no history or seed backfill is synthesized.

## Storage

Migration `0014_notifications.sql` adds the `notifications` table and its indexes/constraints. It retains every existing table and row. Fields include recipient and actor IDs, kind, event key, source/update/comment references, UTC creation time and nullable read time. Creation time has millisecond precision so API cursor serialization preserves ordering exactly; UUID breaks ties.

Foreign keys cascade physically deleted referenced posts, updates or comments; deleting an actor sets the actor reference to null. Existing author-controlled post soft deletion still preserves the public tombstone and official history. Names and post titles are hydrated from their current records, rather than copying private email or comment bodies into receipts.

Recipient/creation and partial unread indexes support newest-first pagination and counts. The table is declared alongside existing social tables in `src/lib/server/db/community-social-schema.ts`, already covered by Drizzle configuration.

## Authenticated API

| Method | Path/body | Result |
| --- | --- | --- |
| GET | `/api/notifications?filter=all&limit=20&cursor=...` | Owned `items`, global `unreadCount`, `hasMore`, nullable `nextCursor` |
| GET | `filter=unread` | Only unread entries; global count remains independent of the page |
| PATCH | `{ "action": "read", "id": "<uuid>" }` | Idempotent owned read; another account's valid ID returns 404 |
| PATCH | `{ "action": "read-all" }` | Marks this account's current unread entries read |

Limit defaults to 20 and accepts integer 1–50. Cursors are opaque, bounded base64url JSON containing creation time and UUID, validated server-side. Paging uses `(createdAt,id)` descending and strict keyset bounds; concurrent new entries do not shift later pages. Page rows/counts share a repeatable-read transaction. Bad cursors, filters, limits or mutation fields return 400; non-JSON writes return 415.

Each entry returns `id`, `kind` (`REPORT_PROGRESS`, `REPORT_RESOLVED`, `COMMENT`, `REPLY`), `postId`, nullable `repostId` and unified `commentId`, `postTitle`, public actor `{ id, name, avatarUrl }` or null, `createdAt` and nullable `readAt`. Clients construct discussion links from validated IDs. Government receipt destinations retain the exact official update; the thread independently shows the hazard's current canonical status.

Read responses are `{ success: true, unreadCount, readAt }`. Re-reading one entry preserves its original read time. Request bodies cannot select a user/recipient. Missing/expired sessions return 401, non-active accounts 403. Existing bearer handling, exact browser origin allowlist and cookie CSRF rules remain enabled. Private responses are `no-store`. `GET /api` advertises the `notifications` capability.

## Deployment

Merge the reviewed backend `feat/notifications` branch, pull it on the Azure VM and use the existing command:

```bash
./surios.sh build
```

The production entrypoint applies pending migrations, including `0014_notifications.sql`, before serving the new API. No new environment variables, administrator creation, report resets or reseeding are required. SMTP remains optional. The mobile repository has its own `feat/notifications` branch; deploy the backend before expecting its inbox to work against Azure.

## Validation

`tests/notifications.spec.ts` is an opt-in isolated API suite. It covers authenticated/active access, origins and cookie CSRF, linked-author fan-out, actual official destinations, self/duplicate suppression, comment/reply recipients, owned/idempotent read receipts, independent accounts, future events, invalid mutations and tied-timestamp pagination.

It requires `SURIOS_TEST_NOTIFICATIONS_LIVE=1`, a loopback `SURIOS_TEST_API_ORIGIN` and `DATABASE_URL` pointing to the disposable `surios_mobile_notifications_*` fixture. It refuses Azure and the primary database. Use `playwright.notifications.config.ts` with that explicitly provisioned fixture; the normal website regression skips these fixture-only cases.

The mobile suite additionally tests browser layout, filters, stale pagination/badge results, read failures, session expiry, real saved discussion/evidence navigation and account-scoped mark-all. Native foreground/Back and screen-reader behavior still require physical-device acceptance. Push credentials and delivery are outside this in-app inbox feature.
