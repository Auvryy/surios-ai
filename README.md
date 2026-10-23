# SuriOS — Municipal Civil Infrastructure Triage & Rider Safety Platform

**UN SDG 9 (Industry, Innovation, and Infrastructure) & SDG 11 (Sustainable Cities)**  
*Automated ASTM D6433 Road Distress Detection, Two-Wheeler (VRU) Lethality Profiling, and Accountable Municipal Maintenance Dispatch.*

---

## 1. Overview

**SuriOS** (from Tagalog *suri* — to inspect, analyze, and appraise) transforms municipal road management from reactive crisis patching into proactive, standards-based preventative maintenance. Anchored in the **Santa Cruz, Laguna provincial corridor (`14.2813° N, 121.4173° E`)**, SuriOS pairs smartphone camera telemetry with **Google Gemini Multimodal Vision** and deterministic civil engineering models.

### Key Capabilities
* **ASTM D6433 Distress Triage:** Classifies potholes, alligator cracking, rutting, ravelling, edge drop-offs, and drainage failures with a deterministic **Hazard Severity Index (`1–10`)**.
* **Two-Wheeler Lethality Index (VRU Profiling):** Specifically evaluates fatal rim-strike and traction-loss hazards for motorcycles, tricycles, and bicycles (which comprise over **68% of provincial road commuters**).
* **Haversine `~25m` Geo-Clustering:** Groups nearby open reports only when damage type and shared or AI-matched evidence agree. Unique support increases priority separately from damage severity.
* **Gemini "Proof of Patch" Verification:** Prevents "ghost repairs" by auditing after-repair contractor photos for surface planarity, edge tacking, and void elimination before closing tickets.
* **Zero AI-Slop Design System:** Authentic **`shadcn-svelte`** interface with flat matte surfaces, 1px micro-borders, soft **Inter** typography, zero gradients, and 100% Dark/Light Mode parity.

---

## 2. Documentation Index (Orchestrator Blueprint)

| Document | Purpose |
| :--- | :--- |
| **[`docs/FUNCTIONAL_SPECIFICATIONS.md`](./docs/FUNCTIONAL_SPECIFICATIONS.md)** | **Master Orchestrator Blueprint:** Every route, API contract, RBAC matrix, and deterministic equation. |
| **[`docs/FEATURES_ROADMAP.md`](./docs/FEATURES_ROADMAP.md)** | **3-Phase Implementation Plan:** Phase 1 (Auth/Shell), Phase 2 (Inside Content), Phase 3 (Proof of Patch & Polish). |
| **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** | End-to-end system topology, cryptographic session flow, and PostgreSQL ER diagram. |
| **[`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)** | Zero AI-Slop Charter, OKLCH semantic tokens, and `shadcn-svelte` component architecture. |
| **[`docs/SYSTEM_GOALS.md`](./docs/SYSTEM_GOALS.md)** | UN SDG 9/11/16 alignment, 1:6 preventative maintenance ROI curve, and Pitch Q&A Defense Matrix. |
| **[`docs/ROAD_HAZARDS.md`](./docs/ROAD_HAZARDS.md)** | Feed-first navigation, collapsible map controls, severity, community support, priority, and AI-assisted evidence grouping. |
| **[`docs/ACCOUNT_SETTINGS.md`](./docs/ACCOUNT_SETTINGS.md)** | Essential settings, email preferences/delivery, password changes, recovery, and mail setup. |
| **[`docs/COMMUNITY_PROFILES.md`](./docs/COMMUNITY_PROFILES.md)** | Public profiles, profile/cover photos, author navigation, and saved replies. |
| **[`docs/COMMUNITY_POSTING.md`](./docs/COMMUNITY_POSTING.md)** | Saved community posts, AI assessment, media covers, search, migrations, and browser verification. |
| **[`docs/TECH_STACK.md`](./docs/TECH_STACK.md)** | Technology stack matrix and architectural justifications. |
| **[`docs/DOCKER_RUNBOOK.md`](./docs/DOCKER_RUNBOOK.md)** | Local development (`port 5433`) and Ubuntu Azure VM production (`docker-compose.prod.yml`) commands. |

---

## 3. Quickstart & Demo Accounts

### 1. Start Local PostgreSQL (`port 5433`)
```bash
docker compose up -d
npm run db:push
```

### 2. Start Development Server
```bash
npm run dev -- --host 0.0.0.0
```
Open **`http://localhost:5173`**. The landing page is the community feed; **Road hazards** is available at `/map`.

### 3. Pre-Seeded Municipal Demo Accounts (`/login`)
On first boot, SuriOS automatically provisions 3 municipal RBAC accounts (all using password `Password123!`):

| Role | Email | Password | Municipal Authority |
| :--- | :--- | :--- | :--- |
| **`ENGINEER` (Admin)** | `engineer@surios.gov` | `Password123!` | Chief Civil Engineer — Full work order dispatch, closure sign-off, and ASTM threshold calibration. |
| **`OFFICER` (Inspector)** | `inspector@surios.gov` | `Password123!` | Field Safety Inspector — Hazard validation, crew routing, and Proof-of-Patch photo submission. |
| **`CITIZEN` (Reporter)** | `citizen@surios.gov` | `Password123!` | Public Commuter — Field hazard capture, community confirmation voting, and status tracking. |
