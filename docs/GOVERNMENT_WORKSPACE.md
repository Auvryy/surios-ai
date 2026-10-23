# Government quote updates

Government work now centers on **public updates quoting a citizen report**.
The six shared destinations remain; `/dashboard` is the single **Government
updates** page. Crew assignment and the dimensional material calculator were
removed from the interface. Historical work-order data are retained.

## Publishing an update

Sign in as an engineer, officer or admin. On a feed post choose **Update**, or
open Government updates, find the report and choose **Post government update**.
The government queue shows one representative post per shared hazard.

- Choose **In progress** or **Resolved**.
- Explain the action or reason in up to 1,000 characters.
- Attach JPEG/PNG/WebP photos or PDF documents, up to 4 MiB each. There is no
  four-photo limit: the composer uploads individual files and publishes their
  references together. Work instructions, completion paperwork and repair photos are supported.
  Upload signatures and per-file limits are checked server-side. Unpublished
  uploads belong to their uploader, expire after 24 hours and are cleaned on
  subsequent uploads; publication claims them transactionally. PDFs download as files
  with `nosniff` and a sandbox policy; they are not embedded as active content.
- Optionally enter up to 20 labeled budget amounts in PHP, with two decimal
  places. Label the breakdown **Estimated budget** or **Actual expenditure**.
  Totals are sums of the entered amounts; there are no assumed material prices,
  measured quantities or automatically certified costs.

The public quote emphasizes the government's text and evidence. The original
report appears underneath as a small linked card with two media thumbnails and
a noninteractive OpenStreetMap preview with a link to the full map. Opening an
official update displays that update prominently, rather than repeating a large
copy of the original report. Other official updates remain available as history.
The feed gallery shows up to four photos, with +N on the fourth tile for extra
photos. Full-page gallery navigation reaches every photo. Green Resolved and
amber In progress chips distinguish the current status.

Quotes have their own saved likes, comments/replies, comment likes and repost
targets. A repost of an official update quotes that government author/content,
rather than silently sharing only the original citizen report. These actions
do not change source confirmations or hazard evidence. The shared Share dialog
offers copying the exact quote permalink, Facebook and Messenger/device sharing
without posting anything automatically. Guest write actions,
cross-origin writes and cross-thread replies are refused.

The Photos filter includes official repair photos even when the quoted source
contains only video. The CSV download includes official quotes, budgets, evidence
links and dates.

## Shared report status and grouped posts

Every post refers to a canonical `reports.id`. Publishing an official quote locks
that shared report and commits the quote, report status and audit event in one
transaction. **In progress** maps to the existing `IN_REPAIR` state; **Resolved**
maps to `RESOLVED`. The citizen map reads the same record.

All posts sharing that report display the same current status. Their status
buttons open the latest government explanation and evidence, including when it
quoted a different post in the group. The source thread shows official updates
from all posts in its group. Nearby but separately classified reports are not
closed automatically. Existing same-hazard evidence grouping rules still apply;
posting a quote never adds a hazard observation or increases severity/support.
A later In progress update can reopen a resolved report, with history retained.
A follow-up composer on an already resolved report defaults to Resolved. Older
quotes show the current report status and preserve their originally posted status
as history; their status buttons also link to the latest official explanation.

Request UUIDs prevent duplicate updates on retry. Official updates cannot be
undone using the social repost deletion endpoint. Corrections are new public
updates. Report locking plus database timestamps order concurrent office updates.

## Municipal and barangay profiles

Government accounts edit their own name, government level (municipality or
barangay), jurisdiction, description, avatar and cover through **Account**.
Visitors see these details and the office's post/update feed inside
`/community?profile=<UUID>`, consistent with other public profiles. Citizen
accounts cannot add government metadata or publish official statuses.

Public statistics show distinct reports handled, currently In progress, and
Resolved. Repeated quotes about one report count once. A report is attributed
to the account that authored its latest official update; a later update from
another office transfers attribution. These are operational counts, not an
independent certification of repair quality or government spending.

## Migration and presentation example

Apply migrations through `0007_community-social.sql`, then additive
`0008_government-updates.sql`, then `0009_quote-interactions.sql`. Migration
0009 adds quote-specific interactions, a quoted-repost reference and staged
evidence uploads. Migration 0008 adds nullable JSON metadata to
users and reposts; it does not delete existing posts, reports or work orders.
Use the normal journal-managed migration runner where configured. On a database
whose earlier migrations were applied manually, apply only the new SQL file.

Run these explicit seeds after starting the development app once:

```bash
node --env-file-if-exists=.env scripts/seed-community.mjs
node --env-file-if-exists=.env scripts/seed-government.mjs
```

The government seed only selects the labeled presentation pothole from the
community seed. It adds a **Demo · Santa Cruz Municipal Office** account,
In progress and Resolved quote updates, downloadable sample work/completion PDFs,
and a PHP 5,000 illustrative breakdown for materials, labor and equipment.
The resolved example also contains nine explicitly labeled sample gallery images
(+5 overflow). These repeat the existing sample road photos to demonstrate the
layout and do not purport to show a real repair. All linked demo posts show
Resolved. Re-running the seed retains the example and applies its gallery
enhancement only once. It is never called by application startup.

Demo login: `municipality@surios.gov` / `Password123!`.
Documents and quote details explicitly identify the demonstration and make no
claim of real maintenance, official certification or actual public spending.

Account switching has been removed in all modes. Production disables automatic demo
account creation and public self-registration for government roles.

## Verification

`tests/government-workspace.spec.ts` covers all three government roles, shared
navigation, removal of crew/calculator controls, budget/photo/PDF persistence,
grouped-post closure and links, unrelated-report isolation, map status, profile
statistics, municipal/barangay profile editing, mobile widths, authorization,
input limits, idempotency, retained history and concurrent office updates.

`tests/quote-interactions.spec.ts` verifies nine-photo publication and navigation,
compact original media/map, reactions, comments/replies/likes, precise repost
targets, unchanged hazard support, upload ownership/expiry/single claiming and
concurrent request retries.
