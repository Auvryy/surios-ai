# SuriOS — Master Functional & Engineering Specifications

**Role:** System Orchestrator Blueprint  
**Mission:** UN SDG 9 (Industry, Innovation, and Infrastructure) & SDG 11 (Sustainable Cities) — Municipal Civil Infrastructure Defect Triage, Two-Wheeler (VRU) Safety Profiling, and Accountable Public Works Dispatch.

> [!IMPORTANT]
> This document is the single source of truth for **every function, route, server action, API endpoint, database entity, and mathematical model** in SuriOS. Every feature in Phase 1, Phase 2, and Phase 3 must be implemented strictly according to these specifications.

---

## 1. System Sitemap & Dual-Persona Route Architecture

SuriOS is structured around a **Two-Persona Swiss Minimalist Sidebar Shell** (`src/routes/+layout.svelte`) that strictly separates **Community Citizen (`CITIZEN`)** workflows from **Government Engineering (`ENGINEER` / `OFFICER` / `ADMIN`)** workflows. Non-essential standalone pages (`/docs` "Civil Standards" and `/crews` standalone contractor directory) have been pruned to prevent feature bloat; crew assignment is embedded directly inline within `/dashboard`.

| Route | Module Name | Target Persona | 5-Word Functional Mandate | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **`/community`** | **Civic Feed** | Shared (Community & Gov) | *Single-column social road hazard stream.* | **Active** — Centered feed (`max-w-2xl`), vertical inset media dock, `+1 Confirmed` upvoting. |
| **`/liked`** | **Liked History** | Community (`CITIZEN`) | *Track confirmed hazards repair progress.* | **Active** — Citizen watchlist tracking DPWH repair states (`REPORTED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `RESOLVED`). |
| **`/report`** | **Report a hazard** | Community (`CITIZEN`) | *A compact prompt to post road evidence.* | **Active** — Shared composer, photos/video, AI review, precise location, persistent posts. |
| **`/map`** | **Road hazards** | Shared (Community & Gov) | *Real-time geolocated road hazard map.* | **Active** — Stored hazard pins, compact collapsible controls, consistent severity, and linked evidence. |
| **`/dashboard`** | **Triage & Resolve** | Government (`OFFICER`, `ENGINEER`, `ADMIN`) | *Municipal maintenance work order board.* | **Active** — Unified filter pills, inline crew dispatch, status resolution, and CSV export. |
| **`/verification`** | **Proof of Patch QA** | Government (`OFFICER`, `ENGINEER`, `ADMIN`) | *AI-verified asphalt repair sign-off archive.* | **Active** — Before/After photo QA, ASTM D2950 compaction density & DPWH seal. |
| **`/analytics`** | **Road Analytics** | Government (`OFFICER`, `ENGINEER`, `ADMIN`) | *Longitudinal road degradation trend analytics.* | **Active** — 5-year PCI decay curves, monsoon correlation & preventative ROI calculator. |
| **`/profile`, `/profile/[id]`** | **Community profile** | Own / Public | *Name, profile picture, cover photo and posts.* | **Active** — Owner editing, public author profiles, shared posts and replies. |
| **`/settings`** | **System Settings** | Shared (All Logged-In) | *Workspace preferences and alert thresholds.* | **Active** — Theme toggle, VRU alert switches, and ASTM threshold calibration. |

---

## 2. Role-Based Access Control (RBAC) Matrix

Authentication is powered by native Node.js cryptographic primitives (`node:crypto` `scryptSync` with 16-byte random salt and `timingSafeEqual` verification) in [`src/lib/server/auth.ts`](../src/lib/server/auth.ts) and enforced on every request via [`src/hooks.server.ts`](../src/hooks.server.ts).

| Capability / Function | Anonymous Guest | `CITIZEN` | `OFFICER` (Field Inspector) | `ENGINEER` / `ADMIN` (LGU Chief) |
| :--- | :---: | :---: | :---: | :---: |
| View Road hazards (`/map`) | ✅ | ✅ | ✅ | ✅ |
| Submit Field Hazard Report (`/report` & `POST /api/triage`) | ✅ | ✅ | ✅ | ✅ |
| Confirm / Upvote Existing Proximate Defect (`+1 Confirmation`) | ❌ | ✅ | ✅ | ✅ |
| Access Operations Dispatch Canvas (`/dashboard`) | ❌ *(303 `/login`)* | ✅ *(Read-Only)* | ✅ *(Full Dispatch)* | ✅ *(Full Dispatch)* |
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

### 4.4. Operations Dispatch Canvas (`/dashboard` — `src/routes/dashboard/+page.svelte` & `+page.server.ts`)
* **Purpose:** Municipal LGU & DPWH command center for managing ticket lifecycles and dispatching maintenance crews.
* **Server Load (`+page.server.ts`):**
  * Protected by `hooks.server.ts` (requires authenticated session).
  * Loads all `reports` from PostgreSQL and computes real-time KPI aggregates:
    * `totalActive`: count where `status != 'RESOLVED'`
    * `criticalVruCount`: count where `vruLethality IN ('HIGH', 'CRITICAL')` and `status != 'RESOLVED'`
    * `dispatchedCount`: count where `status IN ('DISPATCHED', 'IN_REPAIR')`
    * `resolvedCount`: count where `status == 'RESOLVED'`
* **Server Form Actions (`+page.server.ts` — Phase 2 Implementation):**
  * `?/updateStatus`:
    * **Inputs:** `reportId` (UUID), `newStatus` (`'REPORTED' | 'DISPATCHED' | 'IN_REPAIR' | 'RESOLVED'`), `assignedCrew` (optional string).
    * **RBAC Check:** Must verify `locals.user.role` is `'OFFICER'`, `'ENGINEER'`, or `'ADMIN'`.
    * **Mutation:** Updates `reports.status` and `reports.updatedAt = new Date()` in PostgreSQL.
  * `?/deleteSpamOrDuplicate`:
    * Allows `ENGINEER` / `ADMIN` to remove invalid tickets.
* **Client Functions (`+page.svelte`):**
  * Live Leaflet map synchronized with the table filter.
  * Slide-over **Work Order Dispatch Sheet** allowing officers to assign a crew, view the ASTM materials checklist, and trigger status transitions without page reload (`use:enhance`).
  * `exportCsvManifest()`: Generates and downloads a clean `.csv` file of the currently filtered work orders (`Ticket ID, Distress Type, Latitude, Longitude, Severity, VRU Lethality, Status, Recommended Action, Created At`) for DPWH paper compliance.

---

### 4.5. Gemini "Proof of Patch" Verification (`/verification` & `POST /api/verify-patch`)
* **Purpose:** Eliminates "ghost repairs" (contractors marking tickets resolved without fixing the road) by requiring AI visual sign-off of the completed asphalt patch.
* **Endpoint Specification (`POST /api/verify-patch` — Phase 2/3):**
  * **Inputs (`multipart/form-data`):**
    * `reportId`: UUID of the ticket being resolved.
    * `afterImage`: `File` (Photo of the completed road repair).
    * `latitude` & `longitude`: Geodetic coordinates of the repair crew.
  * **Verification Pipeline:**
    1. Fetch original report from `reports` table.
    2. **Geodetic Integrity Check:** Compute Haversine distance between original defect coordinates and repair photo coordinates. Flag a warning if $> 50\text{m}$.
    3. **Multimodal Comparative Prompt (`verifyRoadPatch` in `gemini.ts`):**
       * Pass BOTH the original defect image (`report.imagePath`) and the new `afterImage` to Gemini Vision.
       * Evaluate 3 civil engineering criteria:
         * `surfacePlanarityScore` ($1-10$): Is the patch flush with the surrounding pavement without dangerous mounds or depressions?
         * `edgeTackingComplete` (`boolean`): Are the edges properly sealed to prevent water ingress?
         * `voidEliminationComplete` (`boolean`): Are all potholes/cracks completely filled?
         * `isApproved` (`boolean`): `true` if `surfacePlanarityScore >= 7` and `voidEliminationComplete === true`.
         * `inspectorNotes` (`string`): Detailed technical audit summary.
    4. **Database Update:**
       * If `isApproved === true`, update `reports.status = 'RESOLVED'` and `reports.resolvedImagePath = newImagePath`.
       * If `isApproved === false`, keep `reports.status = 'IN_REPAIR'` and return the rejection audit notes so the crew can re-compact/seal the patch.

---

### 4.6. Specialized Modules (`/analytics`, `/community`, `/liked`)
1. **`/analytics` (Road Degradation Analytics — Government Only):**
   * Aggregates PostgreSQL `reports` by `distressType`, `riskLevel`, and barangay corridor.
   * Displays 5-year longitudinal PCI decay curves and a **Preventative vs. Reactive Cost Calculator** showing estimated LGU budget saved by fixing defects early.
2. **`/community` (Civic Social Stream — Community Only):**
   * Single-column centered feed (`max-w-2xl mx-auto`) with vertical inset photo/map dock, `+1 Confirmed` upvoting, and top citizen safety contributors.
3. **`/liked` (Liked & Confirmed History — Community Only):**
   * Tracks every road defect a citizen has upvoted so they can monitor DPWH dispatch and repair verification in real time.

### Community profiles

See [COMMUNITY_PROFILES.md](./COMMUNITY_PROFILES.md) for public profiles, photo editing, author links, and persisted comment replies. Apply migration 0004 before starting this version.
