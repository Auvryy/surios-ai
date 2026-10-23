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
* **Government Quote Updates:** Public In progress/Resolved quotes with photos or PDF evidence, itemized PHP budgets and municipal/barangay profiles. Resolving a shared hazard updates all linked posts and the map, with direct links to the government explanation.
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
| **[`docs/GOVERNMENT_WORKSPACE.md`](./docs/GOVERNMENT_WORKSPACE.md)** | Government quote updates, linked-post resolution, evidence, budgets, office profiles, demo seed and migration 0008. |
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

Government accounts keep the six shared destinations plus **Government updates** at `/dashboard`. Officials quote citizen posts with progress/resolution evidence and optional budget breakdowns. Existing databases must apply migrations through `0008_government-updates.sql`. See the [government guide](docs/GOVERNMENT_WORKSPACE.md) for migration and explicit presentation seed commands.

### 3. Pre-Seeded Municipal Demo Accounts (`/login`)
In development, SuriOS provisions 3 demo accounts (all using password `Password123!`). Production does not create demo users or expose demo persona switching; public production registration creates citizen accounts only.

| Role | Email | Password | Municipal Authority |
| :--- | :--- | :--- | :--- |
| **`ENGINEER`** | `engineer@surios.gov` | `Password123!` | Progress/resolution quote updates, evidence, budgets, office profile and export. |
| **`OFFICER` (Inspector)** | `inspector@surios.gov` | `Password123!` | Progress/resolution quote updates, evidence, budgets, office profile and export. |
| **`CITIZEN` (Reporter)** | `citizen@surios.gov` | `Password123!` | Public Commuter — Field hazard capture, community confirmation voting, and status tracking. |

Run `node --env-file-if-exists=.env scripts/seed-government.mjs` after the community seed to add the labeled municipal example. Demo login: `municipality@surios.gov` / `Password123!`.
