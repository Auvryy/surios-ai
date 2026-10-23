# Government workspace

Government users keep Feed, Road hazards, Report a hazard, Confirmed updates,
Account, and Settings. One additional destination, **Work orders** (`/dashboard`),
handles the government workflow. There are no separate repair, estimator,
analytics, or audit pages.

`/verification`, `/analytics`, `/docs`, and `/crews` redirect to Work orders for
government users and to the feed otherwise. The removed mock screens and their
simulated approvals, compaction percentages, and budget predictions are gone.

## Work orders

The queue uses the same saved reports as Road hazards. It supports search and
status filtering, selecting a report, and these persistent actions:

1. **Assign crew:** `REPORTED` → `DISPATCHED`.
2. **Start repair:** `DISPATCHED` → `IN_REPAIR`; requires an assigned crew.
3. **Submit repair:** Attach an after-photo and repair notes; moves to
   `AWAITING_REVIEW`.
4. **Review:** A government reviewer records notes and approves (`RESOLVED`) or
   returns it (`IN_REPAIR`). Approval requires a saved after-photo matching the
   evidence the reviewer opened. Stale approvals are rejected.

Each action records its actor, timestamp and description. Submitted image paths
are preserved in the event history, including evidence returned for more work.
State transitions hold a report row lock and update report status, work-order
metadata, and activity in one database transaction. Invalid/stale transitions
fail without changing the report.

Review is a human assessment of photo evidence. It is not a Gemini comparison,
measured compaction test, engineering certification, or authorization of payment.

## Material estimate and exports

Each work order contains an optional, collapsed material estimate form. Enter
measured length and width (m), depth (mm), supplier density (kg/m³), bag weight
(kg), bag price (PHP), and an allowance percentage. No supplier rates or field
dimensions are invented by the application.

- Volume = length × width × depth / 1,000.
- Material mass = volume × density × (1 + allowance / 100).
- Bags = ceiling(material mass / bag weight).
- Material cost = bags × bag price, rounded to two decimal places.

The server validates inputs, calculates and saves the estimate. The result is a
planning estimate for materials only; labor, equipment, and base repairs are
excluded. Resolved work orders retain their saved estimate.

**Export CSV** downloads the matching saved reports, including crew, status,
material estimate and after-photo URL. Text cells are quoted and spreadsheet
formula prefixes are neutralized. **Print record** prints the selected report,
evidence, estimate and activity; the browser can save this as a PDF.

The queue currently shares the map loader's latest-1,000-report window. Filtering
and export apply within that window. Print covers the selected work order.

## Access and migration

Only signed-in `ENGINEER`, `OFFICER`, and `ADMIN` accounts can open Work orders,
export records, or perform its actions. Citizen requests return to the feed.
Return URLs for login, registration and persona switching must stay inside the
allowed workspace.

Development keeps the existing demo role selection, seeded accounts and persona
switch. Production does not seed demo users, hides the switch, rejects the demo
switch action, and restricts public registration to citizen accounts. Government
accounts must be provisioned separately. Existing accounts are not deleted.

Apply `drizzle/0006_government-work-orders.sql` before starting this version.
It adds `work_orders` and `work_order_events` without changing or deleting
existing reports or community data. Use the normal migration runner for a
journal-managed database. Where previous migrations were applied manually, apply
only this new SQL file. The migration has been applied to the local development
database as part of this implementation.

Repair photos use the existing ignored `static/uploads/community` storage and
`/media/` route. Configure deployment upload/body limits consistently with the
existing 10 MB image limit.

## Presentation walkthrough

1. Submit or select a clearly labeled saved demonstration report.
2. Sign in as government staff and open the same report in Work orders.
3. Assign a crew and start repair. Refresh to demonstrate persistence.
4. Optionally enter measured/supplier values and save a material estimate.
5. Upload repair evidence, then review and approve or return it with notes.
6. Open Road hazards to show the same report's updated status.
7. Download CSV or print the selected record.

## Verification

Run these checks from this checkout; browser tests use port 5177 and should run
serially with other suites that use that port:

```bash
npm run check
npm run build
npm run test:community -- tests/government-workspace.spec.ts
npm run test:community
```

The government suite covers all three roles, the six retained shared pages,
single operations destination, mobile/collapsed navigation, legacy redirects,
safe authentication returns, persistent assignment/repair/review, stale evidence,
material arithmetic, native forms, CSV, and citizen-visible map status. Fixtures
and uploaded evidence are scoped to the tests and cleaned afterward.

Validated locally on this implementation:

- Svelte check: zero errors and warnings; production build passed.
- Full existing-plus-government Playwright suite: 33 passed.
- Government suite rerun on final source: 12 passed.
- Reviewed light desktop and mobile layouts at 1,440, 375 and 320 px, plus dark
  mobile. No horizontal overflow in the tested widths.
- Generated a PDF and inspected its text for the selected report, photo labels,
  saved estimate and actor/review history.
- Built-server smoke: government page and CSV return 200, legacy redirects work,
  demo switching and government self-registration are refused. The temporary
  HTTP server used explicit local protocol forwarding and was stopped afterward.
- Scoped cleanup confirmed no government fixture users or reports remain.

The citizen search feature is separate work on `feat/community-search`; its
commits are not included in the government branch by this task.
