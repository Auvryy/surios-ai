# SuriOS — Master Functional & Engineering Specifications

**Role:** System Orchestrator Blueprint  
**Mission:** UN SDG 9 (Industry, Innovation, and Infrastructure) — community reporting, evidence-grounded triage, and accountable public-sector response across public infrastructure.

> [!IMPORTANT]
> Government scope has been consolidated per user direction. [GOVERNMENT_WORKSPACE.md](./GOVERNMENT_WORKSPACE.md) describes the implemented Government updates page: official quotes with progress/resolution status, photo/PDF evidence, itemized budgets and municipal/barangay profiles. It supersedes the crew assignment, material calculator and separate verification/analytics plans.

---

## 1. System Sitemap & Dual-Persona Route Architecture

SuriOS is structured around a **Two-Persona Swiss Minimalist Sidebar Shell** (`src/routes/+layout.svelte`) that strictly separates **Community Citizen (`CITIZEN`)** workflows from **Government Engineering (`ENGINEER` / `OFFICER` / `ADMIN`)** workflows. Non-essential standalone pages (`/docs` "Civil Standards" and `/crews` standalone contractor directory) have been pruned to prevent feature bloat; government action is published through quote updates from `/dashboard` or the shared feed.

| Route | Module Name | Target Persona | 5-Word Functional Mandate | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **`/community`** | **Civic Feed** | Shared (Community & Gov) | *Single-column public infrastructure updates.* | **Active** — Centered feed, media galleries, reactions, discussion, and linked map locations. |
| **`/liked`** | **Liked posts** | Signed-in users | *Browse posts you have liked.* | **Active** — Like-only feed view. |
| **`/report`** | **Report an issue** | Community (`CITIZEN`) | *Capture evidence and its location.* | **Active** — Shared composer, photos/video, AI review, precise location, persistent posts. |
| **`/map`** | **Hazard map** | Shared (Community & Gov) | *Browse geolocated public infrastructure reports.* | **Active** — Stored hazard pins, linked evidence and status; road-section lines apply only to mapped road reports. |
| **`/dashboard`** | **Government updates** | Government (`OFFICER`, `ENGINEER`, `ADMIN`) | *Quote, document, budget, resolve, export.* | **Active** — Public official quotes, shared-report status, evidence and budget breakdowns. |
| **`/verification`, `/analytics`** | **Retired demo pages** | All | *Consolidated into official quote updates.* | Redirect to `/dashboard` for government users and `/community` otherwise. |
| **`/profile`, `/community?profile=[id]`** | **Community profile** | Own / Public | *Name, profile picture, cover photo and posts.* | **Active** — Owner editing, public author profiles, shared posts and replies. |
| **`/settings`** | **Account settings** | Signed-in users | *Email notifications and password security.* | **Active** — Saved email preferences, password change, and email reset links. |

### Current assessment scope

Reports can cover road pavement, bridges and footbridges, drainage channels and flood canals, streetlights and utility poles, water pipes and hydrants, and telecom/fiber cables. The current OpenStreetMap road corridors and road-section lines apply to pavement reports; other assets use their reported point location. ASTM D6433 describes pavement assessment only. The visual model separates visible defects from unverified reporter claims and cannot establish hidden condition, operating status, ownership, water quality or electrical state from appearance alone.

---

## 2. Role-Based Access Control (RBAC) Matrix

Authentication is powered by native Node.js cryptographic primitives (`node:crypto` `scryptSync` with 16-byte random salt and `timingSafeEqual` verification) in [`src/lib/server/auth.ts`](../src/lib/server/auth.ts) and enforced on every request via [`src/hooks.server.ts`](../src/hooks.server.ts).

| Capability / Function | Anonymous Guest | `CITIZEN` | `OFFICER` (Field Inspector) | `ENGINEER` / `ADMIN` (LGU Chief) |
| :--- | :---: | :---: | :---: | :---: |
| View Hazard map (`/map`) | ✅ | ✅ | ✅ | ✅ |
| Submit public infrastructure report (`/report` & community API) | ✅ | ✅ | ✅ | ✅ |
| Confirm / Upvote Existing Proximate Defect (`+1 Confirmation`) | ❌ | ✅ | ✅ | ✅ |
| Access Government updates (`/dashboard`) | ❌ *(303 `/login`)* | ❌ *(303 `/community`)* | ✅ | ✅ |
| Publish In progress quote with evidence | ❌ | ❌ | ✅ | ✅ |
| Attach repair photos or PDF paperwork | ❌ | ❌ | ✅ | ✅ |
| Publish Resolved quote and close linked posts | ❌ | ❌ | ✅ | ✅ |
| Edit own municipality/barangay profile | ❌ | ❌ | ✅ | ✅ |
| Export saved official quote updates and budgets (CSV) | ❌ | ❌ | ✅ | ✅ |

---

## 3. Core Mathematical & Engineering Models

To ensure SuriOS is an authentic civil engineering platform rather than a generic AI wrapper, the backend combines **Google Gemini Multimodal Vision extraction** with **deterministic civil engineering formulas**.

### A. Severity and risk consistency

The implemented severity is the AI's integer estimate clamped to 1–10. Risk labels are derived from the score and do not impose severity floors. Display bands are 1–3 LOW, 4–7 MODERATE, and 8–10 CRITICAL. New assessments require explicit visible serious-danger evidence and high confidence for scores 8–10. These are triage estimates, not certified inspections; ASTM D6433 applies only to pavement.

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
- Errors never return a successful pending ticket. Invalid files/coordinates keep the form available; 422 identifies media that does not show recognizable public infrastructure; unavailable AI/storage returns an error.

### 4.2. Hazard map (`/map`)

The landing page is the community feed (`/community`); `/` redirects there. Hazard map is a separate full-map workspace backed by stored reports only.

`src/lib/server/map-hazards.ts` loads up to 1,000 recently updated reports, their linked posts, and observation metadata. It normalizes legacy risk labels for display, computes priority, and supplies real timestamps and support counts. It does not inject demo incidents or invented corridor condition values.

The map exposes compact floating report/filter/layer/legend controls. Pins and list cards share search, status, issue type, severity, and public-exposure filters, with independent sort options. Overlapping pins are visually clustered without changing report identity. A selected pin has a compact preview that expands for details and linked evidence. Solid road lines show only explicitly reported pavement sections; dashed reference roads are geographic context, not condition readings. Data refreshes every 30 seconds while visible.

The shared sidebar can collapse and remember its state. Mobile navigation remains a drawer. Map resizing preserves the current view. Legacy root map links redirect to `/map?report=...`.

### 4.3. Field Report Capture (`/report`)

The report page opens with a minimal camera/upload box and a Take a photo action. Image selection opens the shared community composer with the images attached; the camera action requests rear-camera capture on supporting mobile browsers. The composer supports multiple images/video, a selectable cover, precise map placement, AI review before publishing, and persistent feed posts linked to canonical map pins. Posting requires sign-in. Publishing opens the exact saved post in the feed. The old module introduction, fixed nearby-confirmation banner, pitch demos, and separate single-photo form have been removed. The legacy `/api/triage` field-capture endpoint remains available; it is no longer the report page’s submission flow.

See [ROAD_HAZARDS.md](./ROAD_HAZARDS.md) and [COMMUNITY_POSTING.md](./COMMUNITY_POSTING.md) for the implemented contracts and verification instructions.

---

### 4.4. Government quote updates (`/dashboard`)

The six shared destinations remain, plus one Government updates page. Officials
quote a source community post via `POST /api/community/reposts`, supplying status
`IN_PROGRESS` or `RESOLVED`, details, staged photo/PDF evidence files and an optional
itemized PHP budget labeled estimated or actual. Crew assignment and the material
calculator are retired; their old named form actions return 405.

A transaction locks the shared report and saves the official quote, canonical
status and audit event. Every linked post reflects that status and links to the
latest government explanation. Unrelated nearby reports are unchanged. Repeated
quotes do not increase hazard severity, support or source observation counts.
Profiles show municipality/barangay identity and distinct-report statistics.

See [GOVERNMENT_WORKSPACE.md](./GOVERNMENT_WORKSPACE.md) for storage, limits,
permissions, migrations 0008–0009, quote conversations, CSV export and the labeled presentation dataset.
Separate verification/analytics pages remain retired redirects.

### 4.5. Shared community pages

`/community` serves the shared feed. `/liked` opens that same feed with the
signed-in user's confirmed filter; it does not duplicate the feed on another
page. `/map` shows report status from the same records updated by official government quotes.

### Community profiles

See [COMMUNITY_PROFILES.md](./COMMUNITY_PROFILES.md) for public profiles, photo editing, author links, and persisted comment replies. Apply migration 0004 before starting this version.

### Account settings and recovery

See [ACCOUNT_SETTINGS.md](./ACCOUNT_SETTINGS.md) for the minimal settings layout, SMTP-backed notifications, password changes/recovery, and migration 0005.
