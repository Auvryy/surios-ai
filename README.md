# SuriOS — Public Infrastructure Reporting & Response

**UN SDG 9 (Industry, Innovation, and Infrastructure) & SDG 11 (Sustainable Cities)**  
*A community platform for documenting local infrastructure issues, assessing visible evidence, and tracking accountable public-sector responses.*

---

## 1. Overview

**SuriOS** (from Tagalog *suri* — to inspect, analyze, and appraise) helps communities document and follow up on public infrastructure issues. Its current workflow is anchored in Santa Cruz, Laguna and combines community posts, location-aware maps, official updates, and **Google Gemini Multimodal Vision**. Roads are the first fully developed map workflow; the platform's assessment and reporting scope also includes other public assets.

### Key Capabilities
* **Multi-asset reporting:** Document defects involving road pavement, bridges and footbridges, drainage and flood canals, streetlights and utility poles, water pipes and hydrants, and telecom/fiber cables.
* **Evidence-grounded assessment:** AI separates visible defects from unverified reporter claims and estimates severity from the supplied media. Scores of 8–10 require clear visible serious danger and high confidence. ASTM D6433 is used only for pavement distress.
* **Location and issue grouping:** Nearby reports are grouped only when location and supporting evidence indicate the same issue. Community support increases priority separately from physical severity.
* **Hazard map:** Browse geolocated reports on a street map. Reference road lines and road-section geometry apply only to road reports; other assets use their reported point location.
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
| **[`docs/SYSTEM_GOALS.md`](./docs/SYSTEM_GOALS.md)** | SDG 9 alignment, supported infrastructure types, evidence limits, and pilot impact measures. |
| **[`docs/ROAD_HAZARDS.md`](./docs/ROAD_HAZARDS.md)** | Feed-first navigation, collapsible map controls, severity, community support, priority, and AI-assisted evidence grouping. |
| **[`docs/GOVERNMENT_WORKSPACE.md`](./docs/GOVERNMENT_WORKSPACE.md)** | Government quote updates, linked-post resolution, evidence, budgets, office profiles, gallery, quote conversations, sharing, demo seed and migrations 0008–0009. |
| **[`docs/ACCOUNT_SETTINGS.md`](./docs/ACCOUNT_SETTINGS.md)** | Essential settings, email preferences/delivery, password changes, recovery, and mail setup. |
| **[`docs/COMMUNITY_PROFILES.md`](./docs/COMMUNITY_PROFILES.md)** | Public profiles, profile/cover photos, author navigation, and saved replies. |
| **[`docs/COMMUNITY_POSTING.md`](./docs/COMMUNITY_POSTING.md)** | Saved infrastructure reports, evidence-grounded AI assessment, media covers, search, and migrations. |
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
Open **`http://localhost:5173`**. The landing page is the community feed; **Hazard map** is available at `/map`.

Government accounts keep the six shared destinations plus **Government updates** at `/dashboard`. Officials quote citizen posts with progress/resolution evidence and optional budget breakdowns. Existing databases should apply migrations through `0011_community-post-soft-delete.sql`. See the [government guide](docs/GOVERNMENT_WORKSPACE.md) for migration and explicit presentation seed commands.

### 3. Pre-Seeded Municipal Demo Accounts (`/login`)
In development, SuriOS provisions 3 demo accounts (all using password `Password123!`). Account switching is removed; use the normal login for seeded accounts. Production does not create demo users; public production registration creates citizen accounts only.

| Role | Email | Password | Municipal Authority |
| :--- | :--- | :--- | :--- |
| **`ENGINEER`** | `engineer@surios.gov` | `Password123!` | Progress/resolution quote updates, evidence, budgets, office profile and export. |
| **`OFFICER` (Inspector)** | `inspector@surios.gov` | `Password123!` | Progress/resolution quote updates, evidence, budgets, office profile and export. |
| **`CITIZEN` (Reporter)** | `citizen@surios.gov` | `Password123!` | Public Commuter — Field hazard capture, community confirmation voting, and status tracking. |

Run `node --env-file-if-exists=.env scripts/seed-government.mjs` after the community seed to add the labeled municipal example. Demo login: `municipality@surios.gov` / `Password123!`.
