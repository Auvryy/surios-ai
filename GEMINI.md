# SuriOS — Engineering & AI Agent Constitution

> **For all AI Assistants, Agents, and Engineers:**  
> Read this document completely before generating code, creating files, or modifying any component in this repository. Strict adherence to these principles is required.

---

## 1. Project Mission & Context

**SuriOS** (from Tagalog *suri* — to inspect, analyze, and appraise) is an AI-driven public civil infrastructure defect detection, hazard triage, and municipal maintenance dispatch platform aligned with **UN Sustainable Development Goal 9: Industry, Innovation, and Infrastructure**.

### The Core Problem & Solution
- **The Problem:** Local governments lack a shared, evidence-based way for residents and staff to document defects across public infrastructure and track the response after assets are in service.
- **The Solution:**
  1. Residents or city inspectors capture photos/videos and a location for an infrastructure concern.
  2. Google Gemini Multimodal Vision checks for recognizable public infrastructure, separates visible observations from unverified reporter claims, classifies the issue, and estimates severity. ASTM D6433 terminology applies only to road pavement.
  3. A deterministic **Hazard Severity Index (1–10)** and recommended civil maintenance actions are generated.
  4. Reports are grouped only when evidence supports the same asset/issue, then linked to official progress and resolution updates for public tracking.

The assessment scope includes road pavement, bridges and footbridges, drainage channels and flood canals, streetlights and utility poles, water pipes and hydrants, and telecom/fiber infrastructure. The current map's OSM road corridors and drawn road sections apply to road reports; other assets are represented by their reported point location. A photo cannot establish hidden structural condition, service status, ownership, water quality, or whether a cable is energized.

---

## 2. Mandatory Tech Stack & Architecture

You must strictly preserve this technology stack. Do **not** suggest, introduce, or swap in other meta-frameworks or state management paradigms:

| Layer | Technology | Rules & Conventions |
| :--- | :--- | :--- |
| **Frontend Framework** | **Svelte 5** | **Runes syntax only (`$state`, `$derived`, `$effect`, `$props`, `$bindable`).** <br>❌ NEVER use legacy Svelte 3/4 stores (`writable`, `derived`, `subscribe`). <br>❌ NEVER use legacy `export let`. |
| **Meta-Framework** | **SvelteKit** (TypeScript) | Form actions in `+page.server.ts`, API endpoints in `+server.ts`. Client-side SPA navigation via progressive enhancement (`use:enhance`). |
| **Styling & UI** | **Tailwind CSS v4 + shadcn-svelte** | Bits UI primitives, Lucide icons (`@lucide/svelte`). Minimalist, accessible, high-trust civic tech styling. |
| **AI Vision Engine** | **Google Gemini API** (`@google/genai`) | Default assessment/matching model: `gemini-3.5-flash-lite` (MINIMAL thinking; no automatic larger-model fallback). Structured output with strict Zod schema validation. |
| **Database** | **PostgreSQL** | Coordinate storage, triage payloads (`JSONB`), ticket lifecycle status. |
| **Container & Infra** | **Docker & Docker Compose** | Ubuntu Azure Virtual Machine behind Nginx reverse proxy (subdomain routing, SSL termination on 80/443). |

---

## 3. Strict Code & Engineering Standards

### A. Svelte 5 Conventions
* All component state must be declared using `$state()`.
* Derived computations must use `$derived()` or `$derived.by()`.
* Side-effects (such as initializing DOM maps like Leaflet/MapLibre) must run inside `$effect()`.
* Component properties must be received via `$props()`.
* Two-way bindings on component props must use `$bindable()`.

### B. Backend & Security Rules
* **API Key Isolation:** The `GEMINI_API_KEY` must **never** be imported or exposed in client-facing code. Always access it on the server using `$env/static/private` or standard server environment loaders.
* **Image Handling:** Never store raw image base64 strings or BLOBs inside PostgreSQL tables. Save images to disk/storage volumes and store only relative file paths and metadata in the database.
* **HTTPS Requirement:** Remember that the HTML5 Geolocation API (`navigator.geolocation`) requires an HTTPS secure context on physical mobile devices. Always design citizen reporting flows with progressive fallback.

### C. Public Infrastructure & AI Triage Standards
* Apply **ASTM D6433** only to road and parking-lot pavement. Do not present that pavement standard as a bridge, utility, lighting, or telecom inspection method.
* Supported issue classifications:
  - `pothole`
  - `alligator_cracking` (fatigue cracking)
  - `longitudinal_transverse_cracking`
  - `rutting`
  - `ravelling_weathering`
  - `drainage_culvert_failure`
  - `bridge_structure_defect`, `footbridge_access_defect`
  - `drainage_channel_failure`, `drainage_cover_missing`, `drainage_blockage`
  - `streetlight_damage`, `utility_pole_damage`
  - `water_pipe_leak`, `hydrant_damage`, `telecom_cable_hazard`
* **Evidence discipline:** `visibleDefects` contains only what the supplied media shows. `reportedConditions` restates user claims as unverified; those claims alone never raise severity or establish a critical hazard. Do not infer hidden damage, outage, cause, public/private ownership, water quality, electrical state, or completed work.
* **Severity:** Use the full 1–10 scale proportionately. Scores 8–10 require clear visible evidence of severe immediate danger and high confidence; ordinary defects usually remain at 4 or lower when the evidence shows only localized minor damage.
* **Public exposure:** Describe people and access-path exposure visible in the media. Do not invent two-wheeler risk or fatal outcomes where those are not visible.
* **Spam Filter:** If the media does not show recognizable public infrastructure, reject it with a clear explanation; a text description by itself is not proof.

---

## 4. Git, Workspace & Workflow Protocols (CRITICAL)

All agents and contributors must strictly adhere to these operational boundaries:

1. **Strict Workspace Isolation:**
   - **Stay inside the project:** The agent must operate strictly within `/home/andy/Projects/surios-ai`.
   - **Never explore external directories:** Do NOT read, search, modify, or create files in parent directories (such as `/home/andy`, other projects in `/home/andy/Projects/`, or system folders) unless explicitly instructed by the user.

2. **Sensitive File Protection & Gitignore Hygiene:**
   - **Zero Secrets Policy:** Never commit, stage, or push credentials, tokens, or environment files (`.env`, `.env.local`, `.env.*`, private certificates, SSH keys).
   - Always verify `.gitignore` before creating or committing new file patterns.
   - If an environment template is needed, document the variable in `.env.example` with empty dummy values.

3. **Branching Strategy (ZERO TOLERANCE ON MAIN):**
   > [!CAUTION]
   > **NEVER EVER WORK ON `main` DIRECTLY.**
   > The `main` branch is strictly protected for verified production releases. Every single task, refactor, bugfix, or feature MUST be developed on a dedicated branch created via `git checkout -b <branch-name>` before any files are created or modified.

   - Always create a dedicated branch before working on a task or feature.
   - **Straightforward & Functional Branch Naming Rule:**
     - Branch names MUST be simple, literal, and directly state the functional feature or component (keep it 2–3 words max).
     - ✅ **Good / Functional Examples:**
       - `feat/report-demo`
       - `feat/camera-capture`
       - `feat/map-navigation`
       - `fix/gps-accuracy`
       - `chore/update-dependencies`
     - ❌ **Weird, Poetic, or Conceptual Names (NEVER USE):**
       - `feat/matte-telemetry-map` (too abstract / stylistic)
       - `feat/shutter-canvas-flow` (poetic)
       - `feat/ai-wizardry` (non-functional)
   - Standard Prefixes:
     - Feature branches: `feat/<feature-name>` (e.g., `feat/triage-api`)
     - Fix branches: `fix/<bug-name>` (e.g., `fix/gps-permissions`)
     - Chore / Docs branches: `chore/<task-name>` or `docs/<doc-name>`
   - Only touch and add files relevant to the active task.

4. **Commit Hygiene:**
   - Break changes down into **small, logical, atomic commits**.
   - Commit messages must be concise, natural, and human-worded:
     - ✅ `feat: add zod schema for civil triage analysis`
     - ✅ `fix: prevent map re-centering on ticket selection`
     - ❌ `WIP stuff`
     - ❌ `update code`

5. **Pushing Policy (STRICT):**
   - **DO NOT PUSH AUTOMATICALLY.** The agent must NEVER run `git push`.
   - The user will review and push manually.
   - When finishing a task or commit, the agent must provide a single-line, copy-pastable terminal command with **NO `cd` prefix**, strictly in this format:
     ```bash
     git push -u origin <branch-name>
     ```

---

## 5. Repository Structure Reference

```
surios-ai/
├── GEMINI.md                        # This constitution and project guidelines
├── AGENTS.md                        # Agent quick reference & 7 Golden Rules
├── README.md                        # Project overview, quickstart & documentation index
├── docs/
│   ├── FUNCTIONAL_SPECIFICATIONS.md # Master orchestrator blueprint (every route, API & formula)
│   ├── FEATURES_ROADMAP.md          # 3-Phase execution plan & orchestrator suggestions
│   ├── ARCHITECTURE.md              # System topology, RBAC security & ER diagrams
│   ├── DESIGN_SYSTEM.md             # Zero AI-Slop Charter & shadcn-svelte specifications
│   ├── SYSTEM_GOALS.md              # SDG 9/11/16 alignment, ROI curve & Q&A defense matrix
│   ├── TECH_STACK.md                # Definitive dependency matrix & trade-offs
│   └── DOCKER_RUNBOOK.md            # Local & Azure VM Docker operations
└── src/
    ├── app.html                     # Base HTML document with zero-flicker theme init
    ├── app.d.ts                     # SvelteKit App.Locals & PageData typings
    ├── hooks.server.ts              # Session validation, seed init & RBAC route guards
    ├── routes/
    │   ├── +layout.svelte           # Swiss Minimalist two-persona sidebar shell
    │   ├── +layout.server.ts        # Safe user session serialization
    │   ├── layout.css               # Tailwind v4 + OKLCH theme tokens + Leaflet CSS
    │   ├── +page.svelte             # 1. Map Playground / GIS Canvas
    │   ├── community/               # 2. Community Feed (Single-column social stream)
    │   ├── liked/                   # 3. Liked & Confirmed History (Citizen repair tracker)
    │   ├── report/                  # 4. Camera Report (Mobile camera shutter & GPS triage)
    │   ├── dashboard/               # 5. Triage & Resolve (Gov work order dispatch & resolution)
    │   ├── verification/            # 6. Proof of Patch QA (Gov AI repair sign-off archive)
    │   ├── analytics/               # 7. Road Analytics (Gov PCI decay & budget savings)
    │   ├── profile/                 # 8. Role-Adaptive Profile & 1-Click Persona Switcher
    │   ├── settings/                # 9. System Settings
    │   ├── login/                   # Municipal & citizen authentication
    │   ├── register/                # Account onboarding with role selector
    │   ├── logout/                  # Session invalidation endpoint
    │   └── api/
    │       └── triage/              # POST /api/triage (Gemini multimodal vision endpoint)
    └── lib/
        ├── types/triage.ts          # Zod schemas & TypeScript contracts for civil triage
        ├── server/
        │   ├── auth.ts              # Native scrypt hashing, timing-safe verify & sessions
        │   ├── gemini.ts            # Google GenAI multi-model vision client
        │   └── db/
        │       ├── index.ts         # Drizzle PostgreSQL connection pool
        │       └── schema.ts        # users, sessions, and reports table definitions
        └── components/
            ├── theme-toggle.svelte  # Dark / Light mode switcher
            └── ui/                  # shadcn-svelte components (Card, Sheet, Tabs, EmptyState, etc.)
```
