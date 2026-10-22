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
| **`/community`** | **Civic Feed** | Community (`CITIZEN`) | *Single-column social road hazard stream.* | **Active** — Centered feed (`max-w-2xl`), vertical inset media dock, `+1 Confirmed` upvoting. |
| **`/liked`** | **Liked History** | Community (`CITIZEN`) | *Track confirmed hazards repair progress.* | **Active** — Citizen watchlist tracking DPWH repair states (`REPORTED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `RESOLVED`). |
| **`/report`** | **Camera Report** | Community (`CITIZEN`) | *Camera triage for civil defects.* | **Active** — Mobile camera shutter, GPS lock, `/api/triage` integration. |
| **`/`** | **Map Playground / GIS** | Shared (Community & Gov) | *Real-time geolocated road hazard map.* | **Active** — Interactive Leaflet GIS canvas + safe route avoidance + inspection drawer. |
| **`/dashboard`** | **Triage & Resolve** | Government (`OFFICER`, `ENGINEER`, `ADMIN`) | *Municipal maintenance work order board.* | **Active** — Unified filter pills, inline crew dispatch, status resolution, and CSV export. |
| **`/verification`** | **Proof of Patch QA** | Government (`OFFICER`, `ENGINEER`, `ADMIN`) | *AI-verified asphalt repair sign-off archive.* | **Active** — Before/After photo QA, ASTM D2950 compaction density & DPWH seal. |
| **`/analytics`** | **Road Analytics** | Government (`OFFICER`, `ENGINEER`, `ADMIN`) | *Longitudinal road degradation trend analytics.* | **Active** — 5-year PCI decay curves, monsoon correlation & preventative ROI calculator. |
| **`/profile`** | **Role Profile** | Shared (Role-Adaptive) | *Credentials, stats, and persona switcher.* | **Active** — Adapts to Guardian vs Engineering Officer + 1-Click Demo Persona Switcher. |
| **`/settings`** | **System Settings** | Shared (All Logged-In) | *Workspace preferences and alert thresholds.* | **Active** — Theme toggle, VRU alert switches, and ASTM threshold calibration. |

---

## 2. Role-Based Access Control (RBAC) Matrix

Authentication is powered by native Node.js cryptographic primitives (`node:crypto` `scryptSync` with 16-byte random salt and `timingSafeEqual` verification) in [`src/lib/server/auth.ts`](../src/lib/server/auth.ts) and enforced on every request via [`src/hooks.server.ts`](../src/hooks.server.ts).

| Capability / Function | Anonymous Guest | `CITIZEN` | `OFFICER` (Field Inspector) | `ENGINEER` / `ADMIN` (LGU Chief) |
| :--- | :---: | :---: | :---: | :---: |
| View Live Map Feed (`/`) & Standards (`/docs`) | ✅ | ✅ | ✅ | ✅ |
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

### A. Hybrid Deterministic Hazard Severity Index ($1 - 10$)

When an image is submitted to `POST /api/triage`, Gemini extracts the ASTM D6433 distress category, estimated depth ($D$ in mm), estimated surface area ($A$ in $\text{m}^2$), and road context. The deterministic verification layer validates the **Hazard Severity Score ($S$)**:

$$S = \min\left(10, \max\left(1, \left\lfloor B_{\text{distress}} + W_{\text{depth}}(D) + W_{\text{vru}} + W_{\text{cluster}}(C) \right\rfloor \right)\right)$$

Where:
1. **Base Distress Weight ($B_{\text{distress}}$):**
   * `pothole`: $4.0$
   * `drainage_culvert_failure`: $4.5$
   * `edge_break`: $3.5$
   * `alligator_cracking`: $3.0$
   * `rutting`: $3.0$
   * `longitudinal_transverse_cracking`: $2.0$
   * `ravelling_weathering`: $1.5$
2. **Depth Escalation Factor ($W_{\text{depth}}$):**
   * $D < 25\text{ mm}$: $+0.5$ (Low)
   * $25\text{ mm} \le D \le 50\text{ mm}$: $+2.0$ (Moderate)
   * $50\text{ mm} < D \le 80\text{ mm}$: $+3.5$ (High — Immediate tire/rim strike hazard)
   * $D > 80\text{ mm}$: $+5.0$ (Critical structural crater)
3. **Two-Wheeler Lethality Multiplier ($W_{\text{vru}}$):**
   * $+1.5$ if defect has sharp vertical edges, lies within the primary wheel track, or involves loose gravel/standing water that compromises motorcycle/tricycle stability.
4. **Community Confirmation Boost ($W_{\text{cluster}}$):**
   * $\min(2.0, 0.25 \times (C - 1))$ where $C$ is the number of unique citizen reports within a $25\text{m}$ radius.

### B. Haversine Proximity Geo-Clustering Algorithm (`~25m` Deduplication)

To prevent 50 citizens from creating 50 duplicate tickets for the same pothole in front of LSPU Santa Cruz, `POST /api/triage` must run a spatial proximity check against unresolved (`status != 'RESOLVED'`) tickets in PostgreSQL:

$$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

* Earth radius $r = 6,371,000\text{ meters}$.
* **Clustering Rule:**
  * If an existing open report has $d \le 25.0\text{ meters}$ AND matches the same `distressType` (or both are surface craters/cracks):
    1. **Do NOT insert a duplicate row.**
    2. Increment `community_confirmations = community_confirmations + 1` on the existing report.
    3. Update `updated_at = NOW()`.
    4. Return `clustered: true` and the existing `reportId` to the user, displaying: *"Matched existing hazard cluster within 25m (+1 Priority Confirmation added)."*

---

## 4. Detailed Function-by-Function & Endpoint Specifications

### 4.1. Multimodal Triage Endpoint (`POST /api/triage`)
* **File:** [`src/routes/api/triage/+server.ts`](../src/routes/api/triage/+server.ts)
* **Service:** [`src/lib/server/gemini.ts`](../src/lib/server/gemini.ts) (`analyzeRoadDistress`)
* **Schema:** [`src/lib/types/triage.ts`](../src/lib/types/triage.ts) (`TriageAnalysisSchema`)
* **Input (`multipart/form-data`):**
  * `image`: `File` (Required, JPEG/PNG/WebP/HEIC, $\le 10\text{ MB}$).
  * `latitude`: `number` (Default fallback: `14.2813` — Santa Cruz, Laguna).
  * `longitude`: `number` (Default fallback: `121.4173`).
  * `locationName`: `string` (Optional human-readable corridor/barangay label).
* **Execution Pipeline:**
  1. Validate MIME type and file size ($\le 10\text{ MB}$).
  2. Convert `File` to `Buffer` and invoke `analyzeRoadDistress(buffer, mimeType)`.
  3. **Model Fallback Chain:** Attempt `gemini-flash-lite-latest` $\rightarrow$ `gemini-flash-latest` $\rightarrow$ `gemini-3.8-flash` with `responseMimeType: 'application/json'`.
  4. Validate output through `TriageAnalysisSchema` (with `.default(...)` resilient fallbacks).
  5. **Spam Gate:** If `analysis.isValidInfrastructure === false`:
     * Delete or skip saving the image to disk (prevents storage exhaustion from spam).
     * Return HTTP `422 Unprocessable Entity` with `{ success: false, error: analysis.rejectionReason, analysis }`.
  6. **Persistence & Geo-Clustering:**
     * Write valid infrastructure image to `static/uploads/{timestamp}-{hex}.{ext}`.
     * Query active reports within bounding box $(\pm 0.0003^\circ \approx 33\text{m})$.
     * If Haversine distance $\le 25\text{m}$, increment `communityConfirmations` on existing record; otherwise `INSERT INTO reports`.
  7. **Output (`200 OK`):**
     ```json
     {
       "success": true,
       "data": {
         "reportId": "uuid",
         "clustered": false,
         "communityConfirmations": 1,
         "imagePath": "/uploads/1792500000-a1b2c3.jpg",
         "latitude": 14.2813,
         "longitude": 121.4173,
         "analysis": {
           "isValidInfrastructure": true,
           "distressType": "pothole",
           "hazardSeverity": 9,
           "riskLevel": "CRITICAL",
           "vruLethality": "CRITICAL",
           "vruDetails": "Deep 65mm vertical lip in primary motorcycle lane...",
           "estimatedDimensions": { "depthEstimate": "65mm", "surfaceAreaEstimate": "0.45 sq.m" },
           "recommendedAction": "Full-depth saw-cut, emulsion tack coat, hot-mix asphalt patch...",
           "materialsChecklist": ["Hot-mix asphalt (60kg)", "Bituminous tack coat", "Plate compactor"],
           "urgency": "EMERGENCY",
           "summary": "Critical deep pothole posing severe two-wheeler ejection hazard."
         }
       }
     }
     ```

---

### 4.2. Map Feed Homepage (`/` — `src/routes/+page.svelte` & `+page.server.ts`)
* **Purpose:** Primary operational landing page providing real-time spatial situational awareness.
* **Server Load (`+page.server.ts`):**
  * Queries top 50 reports from PostgreSQL ordered by `createdAt DESC`.
  * Normalizes DB records alongside baseline Santa Cruz corridor telemetry into `FeedIncident[]`.
* **Client Functions (`+page.svelte`):**
  * `filter` state (`'ALL' | 'CRITICAL' | 'REPORTED' | 'DISPATCHED' | 'RESOLVED'`): Reactively filters both the right-hand incident stream AND the Leaflet map markers via `$derived`.
  * `openInspect(incident: FeedIncident)`: Selects an incident, centers the Leaflet map on `[incident.latitude, incident.longitude]`, and opens the right-hand `<Sheet>` drawer.
  * `upvoteIncident(id: string)` *(Phase 2 enhancement)*: Calls `POST /api/reports/[id]/confirm` to increment `communityConfirmations` with optimistic UI update.

---

### 4.3. Field Report Capture (`/report` — `src/routes/report/+page.svelte`)
* **Purpose:** Fast 15-second mobile field reporting for citizens and roving inspectors.
* **Client Functions & Enhancements Required in Phase 2:**
  * `handleCapture(e: Event)`: Reads camera/file input, generates object URL preview, and resets prior error/result state.
  * `detectLocation()`: Acquires high-accuracy GPS (`enableHighAccuracy: true, timeout: 8000`) and reverse-geocodes or labels the Santa Cruz barangay corridor.
  * `submitReport()`:
    * Sends `FormData` to `POST /api/triage`.
    * **Crucial Phase 2 Upgrade:** Instead of showing only a generic *"Report Dispatched"* card, display the **Full AI Triage Result Card** immediately after submission (showing the citizen the detected ASTM distress type, the 1–10 severity score, the VRU Two-Wheeler Warning banner, whether it merged into a 25m community cluster, and a link to view their pin on the Map Feed `/`)—and if `422` spam is returned, show a clear destructive `<Alert>` explaining why the photo was rejected!

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
