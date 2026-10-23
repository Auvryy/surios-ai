# SuriOS — Master Functional & Engineering Specifications

**Role:** System Orchestrator Blueprint  
**Mission:** UN SDG 9 (Industry, Innovation, and Infrastructure) & SDG 11 (Sustainable Cities) — Municipal Civil Infrastructure Defect Triage, Two-Wheeler (VRU) Safety Profiling, and Accountable Public Works Dispatch.

> [!IMPORTANT]
> Government scope has been consolidated per user direction. [GOVERNMENT_WORKSPACE.md](./GOVERNMENT_WORKSPACE.md) describes the implemented single Work orders page and supersedes earlier separate verification/analytics plans. Repair approval is human review of saved evidence; no compaction certification or AI repair sign-off is implemented.

---

## 1. System Sitemap & Dual-Persona Route Architecture

SuriOS is structured around a **Two-Persona Swiss Minimalist Sidebar Shell** (`src/routes/+layout.svelte`) that strictly separates **Community Citizen (`CITIZEN`)** workflows from **Government Engineering (`ENGINEER` / `OFFICER` / `ADMIN`)** workflows. Non-essential standalone pages (`/docs` "Civil Standards" and `/crews` standalone contractor directory) have been pruned to prevent feature bloat; crew assignment is embedded directly inline within `/dashboard`.

| Route | Module Name | Target Persona | 5-Word Functional Mandate | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **`/community`** | **Civic Feed** | Shared (Community & Gov) | *Single-column social road hazard stream.* | **Active** — Centered feed (`max-w-2xl`), vertical inset media dock, `+1 Confirmed` upvoting. |
| **`/liked`** | **Liked History** | Community (`CITIZEN`) | *Track confirmed hazards repair progress.* | **Active** — Citizen watchlist tracking DPWH repair states (`REPORTED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `RESOLVED`). |
| **`/report`** | **Report a hazard** | Community (`CITIZEN`) | *A compact prompt to post road evidence.* | **Active** — Shared composer, photos/video, AI review, precise location, persistent posts. |
| **`/map`** | **Road hazards** | Shared (Community & Gov) | *Real-time geolocated road hazard map.* | **Active** — Stored hazard pins, compact collapsible controls, consistent severity, and linked evidence. |
| **`/dashboard`** | **Work orders** | Government (`OFFICER`, `ENGINEER`, `ADMIN`) | *Assign, repair, review, estimate, export.* | **Active** — Database-backed lifecycle, before/after evidence, human review and saved activity. |
| **`/verification`, `/analytics`** | **Retired demo pages** | All | *Consolidated into existing work orders.* | Redirect to `/dashboard` for government users and `/community` otherwise. |
| **`/profile`, `/community?profile=[id]`** | **Community profile** | Own / Public | *Name, profile picture, cover photo and posts.* | **Active** — Owner editing, public author profiles, shared posts and replies. |
| **`/settings`** | **Account settings** | Signed-in users | *Email notifications and password security.* | **Active** — Saved email preferences, password change, and email reset links. |

---

## 2. Role-Based Access Control (RBAC) Matrix

Authentication is powered by native Node.js cryptographic primitives (`node:crypto` `scryptSync` with 16-byte random salt and `timingSafeEqual` verification) in [`src/lib/server/auth.ts`](../src/lib/server/auth.ts) and enforced on every request via [`src/hooks.server.ts`](../src/hooks.server.ts).

| Capability / Function | Anonymous Guest | `CITIZEN` | `OFFICER` (Field Inspector) | `ENGINEER` / `ADMIN` (LGU Chief) |
| :--- | :---: | :---: | :---: | :---: |
| View Road hazards (`/map`) | ✅ | ✅ | ✅ | ✅ |
| Submit Field Hazard Report (`/report` & `POST /api/triage`) | ✅ | ✅ | ✅ | ✅ |
| Confirm / Upvote Existing Proximate Defect (`+1 Confirmation`) | ❌ | ✅ | ✅ | ✅ |
| Access Work orders (`/dashboard`) | ❌ *(303 `/login`)* | ❌ *(303 `/community`)* | ✅ | ✅ |
| Transition Ticket `REPORTED` → `DISPATCHED` → `IN_REPAIR` | ❌ | ❌ | ✅ | ✅ |
| Submit After-Repair Photo for Proof of Patch | ❌ | ❌ | ✅ | ✅ |
| Authorize Final Ticket Closure (`RESOLVED`) | ❌ | ❌ | ❌ *(Requires AI or Engineer)* | ✅ |
| Calibrate Municipal ASTM Thresholds (`/settings`) | ❌ | ❌ | ❌ | ✅ |
| Export Official DPWH / LGU Work Order Manifests (CSV) | ❌ | ❌ | ✅ | ✅ |

---

## 3. Core Mathematical & Engineering Models

To ensure SuriOS is an authentic civil engineering platform rather than a generic AI wrapper, the backend combines **Google Gemini Multimodal Vision extraction** with **deterministic civil engineering formulas**.

### A. Severity and risk consistency

The implemented severity is the AI's 1–10 estimate with product risk floors: LOW/MODERATE/CRITICAL impose minimums 1/4/8; rider risk NONE/LOW/MODERATE/HIGH/CRITICAL imposes 1/1/4/6/8. Final severity is the maximum, clamped to 1–10. Display bands are 1–3 LOW, 4–7 MODERATE, and 8–10 CRITICAL. These are triage estimates, not a measured ASTM PCI.

### B. Independent support and priority

A contributor counts once across observations and confirmations linked to a canonical report. Signed-out field captures use a media fingerprint; legacy anonymous totals are preserved as a baseline. Support does not increase damage severity.

`priority = min(10, severity + min(2, 0.25 × max(0, support − 1)))`

### C. Evidence grouping

Candidate reports must be open, the same distress type, and within 25 metres by Haversine distance. Exact shared media hashes group directly; different images require a valid candidate ID and a visual AI comparison with model confidence ≥0.85. Uncertain comparisons stay separate. Known media alone cannot increase severity. Genuinely new evidence can raise the canonical severity; resolved reports remain separate.

Both community publishing and field capture use this logic. A transaction and candidate recheck handle concurrent submissions and publishing retries. The complete implemented policy, caveats, schema upgrade, and verification instructions are in [ROAD_HAZARDS.md](./ROAD_HAZARDS.md).

---

## 4. Detailed Function-by-Function & Endpoint Specifications

### 4.1. Multimodal Triage Endpoint (`POST /api/triage`)

- Source: `src/routes/api/triage/+server.ts`; shared reporting logic: `src/lib/server/hazard-reporting.ts`.
- Input: multipart `image` (one JPEG/PNG/WebP, ≤10 MiB), valid numeric `latitude` and `longitude`. Coordinates are required and range-checked.
- File signatures, size, and origin are checked. Gemini assesses the photo; non-infrastructure returns 422. Valid media is saved only after the assessment passes.
- Severity is normalized using section 3. Both field capture and community publishing use the same 25-metre candidate search, hash/AI comparison, unique support, and transactional persistence.
- Address lookup can label the location, but the submitted pin is preserved.
- Success includes `reportId` (display ticket), `rawId` (canonical UUID), `grouped`, `match`, canonical `severity`, `support`, `priority`, `imageUrl`, coordinates, and the individual AI `analysis`.
- Errors never return a successful pending ticket. Invalid files/coordinates keep the form available; 422 identifies non-road evidence; unavailable AI/storage returns an error.

### 4.2. Road hazards (`/map`)

The landing page is the community feed (`/community`); `/` redirects there. Road hazards is a separate full-map workspace backed by stored reports only.

`src/lib/server/map-hazards.ts` loads up to 1,000 recently updated reports, their linked posts, and observation metadata. It normalizes legacy risk labels for display, computes priority, and supplies real timestamps and support counts. It does not inject demo incidents or invented corridor condition values.

The map exposes compact floating report/filter/layer/legend controls. Pins and list cards share search, status, damage, severity, and rider-risk filters, with independent sort options. Overlapping pins are visually clustered without changing report identity. A selected pin has a compact preview that expands for details and linked evidence. Data refreshes every 30 seconds while visible.

The shared sidebar can collapse and remember its state. Mobile navigation remains a drawer. Map resizing preserves the current view. Legacy root map links redirect to `/map?report=...`.

### 4.3. Field Report Capture (`/report`)

The report page opens with a minimal camera/upload box and a Take a photo action. Image selection opens the shared community composer with the images attached; the camera action requests rear-camera capture on supporting mobile browsers. The composer supports multiple images/video, a selectable cover, precise map placement, AI review before publishing, and persistent feed posts linked to canonical map pins. Posting requires sign-in. Publishing opens the exact saved post in the feed. The old module introduction, fixed nearby-confirmation banner, pitch demos, and separate single-photo form have been removed. The legacy `/api/triage` field-capture endpoint remains available; it is no longer the report page’s submission flow.

See [ROAD_HAZARDS.md](./ROAD_HAZARDS.md) and [COMMUNITY_POSTING.md](./COMMUNITY_POSTING.md) for the implemented contracts and verification instructions.

---

### 4.4. Government work orders (`/dashboard`)

The six shared destinations remain available to government users. One Work
orders page handles assignment, repair evidence, human review, material
estimates, CSV and printable records. It uses the same saved reports as the map.

Named form actions are `assign`, `startRepair`, `submitRepair`, `review`, and
`saveEstimate`. Status progresses through `REPORTED`, `DISPATCHED`, `IN_REPAIR`,
`AWAITING_REVIEW`, and `RESOLVED`. Review can return a report for more repair.
The saved after-image must match the evidence version being approved.

See [GOVERNMENT_WORKSPACE.md](./GOVERNMENT_WORKSPACE.md) for the complete current
contract, permissions, storage, migration, limits and presentation walkthrough.
Separate `/verification` and `/analytics` pages are retired redirects. The old
AI certification, compaction measurements, and predictive savings demos are not
part of the implemented workflow.

### 4.5. Shared community pages

`/community` serves the shared feed. `/liked` opens that same feed with the
signed-in user's confirmed filter; it does not duplicate the feed on another
page. `/map` shows report status from the same records updated by Work orders.

### Community profiles

See [COMMUNITY_PROFILES.md](./COMMUNITY_PROFILES.md) for public profiles, photo editing, author links, and persisted comment replies. Apply migration 0004 before starting this version.

### Account settings and recovery

See [ACCOUNT_SETTINGS.md](./ACCOUNT_SETTINGS.md) for the minimal settings layout, SMTP-backed notifications, password changes/recovery, and migration 0005.
