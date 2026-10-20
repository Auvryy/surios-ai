# SuriOS — Engineering & AI Agent Constitution

> **For all AI Assistants, Agents, and Engineers:**  
> Read this document completely before generating code, creating files, or modifying any component in this repository. Strict adherence to these principles is required.

---

## 1. Project Mission & Context

**SuriOS** (from Tagalog *suri* — to inspect, analyze, and appraise) is an AI-driven public civil infrastructure defect detection, hazard triage, and municipal maintenance dispatch platform aligned with **UN Sustainable Development Goal 9: Industry, Innovation, and Infrastructure**.

### The Core Problem & Solution
- **The Problem:** Local municipal governments (LGUs) lack automated, crowdsourced detection and triage systems for road hazards (potholes, alligator cracking, drainage failure, asphalt degradation) once roads are operational.
- **The Solution:**
  1. Citizens or city inspectors capture road defect photos with geolocation coordinates.
  2. Google Gemini Multimodal Vision inspects the photo, filters out spam/non-infrastructure, classifies distress based on civil engineering standards (ASTM D6433), and estimates severity.
  3. A deterministic **Hazard Severity Index (1–10)** and recommended civil maintenance actions are generated.
  4. Maintenance tickets are routed to a real-time, interactive municipal operations dashboard for dispatch and lifecycle tracking.

---

## 2. Mandatory Tech Stack & Architecture

You must strictly preserve this technology stack. Do **not** suggest, introduce, or swap in other meta-frameworks or state management paradigms:

| Layer | Technology | Rules & Conventions |
| :--- | :--- | :--- |
| **Frontend Framework** | **Svelte 5** | **Runes syntax only (`$state`, `$derived`, `$effect`, `$props`, `$bindable`).** <br>❌ NEVER use legacy Svelte 3/4 stores (`writable`, `derived`, `subscribe`). <br>❌ NEVER use legacy `export let`. |
| **Meta-Framework** | **SvelteKit** (TypeScript) | Form actions in `+page.server.ts`, API endpoints in `+server.ts`. Client-side SPA navigation via progressive enhancement (`use:enhance`). |
| **Styling & UI** | **Tailwind CSS v4 + shadcn-svelte** | Bits UI primitives, Lucide icons (`@lucide/svelte`). Minimalist, accessible, high-trust civic tech styling. |
| **AI Vision Engine** | **Google Gemini API** (`@google/genai`) | Model: `gemini-3.5-flash`. Structured output with strict Zod schema validation. |
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

### C. Civil Engineering & AI Triage Standards
* System prompts must align with **ASTM D6433 (Standard Practice for Roads and Parking Lots Pavement Condition Index - PCI)**.
* Standard distress classifications:
  - `pothole`
  - `alligator_cracking` (fatigue cracking)
  - `longitudinal_transverse_cracking`
  - `rutting`
  - `ravelling_weathering`
  - `drainage_culvert_failure`
* **Vulnerable Road User (VRU) Risk:** Always assess hazard risk specifically for two-wheelers (motorcycles, scooters, bicycles) and pedestrians.
* **Spam Filter:** If the image is not civil infrastructure (selfies, pets, indoor photos, blurry captures), immediately set `isValidInfrastructure: false` with a clear explanation.

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

   - Always create a dedicated branch before working on a task or feature:
     - Feature branches: `feat/<feature-name>` (e.g., `feat/triage-api-route`)
     - Fix branches: `fix/<bug-name>` (e.g., `fix/mobile-gps-permissions`)
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
├── GEMINI.md                  # This constitution and project guidelines
├── AGENTS.md                  # Agent quick reference
├── .env.example               # Template for environment variables (safe to commit)
├── .env                       # Local secrets (NEVER commit - strictly in .gitignore)
├── components.json            # shadcn-svelte registry & path alias configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration with $lib aliases
├── vite.config.ts             # Vite configuration with SvelteKit & Tailwind plugins
└── src/
    ├── app.html               # Base HTML document
    ├── routes/
    │   ├── +layout.svelte     # Root application shell & global styles
    │   ├── layout.css         # Global Tailwind CSS imports and theme variables
    │   ├── +page.svelte       # Landing / entrypoint
    │   ├── report/            # Citizen photo capture & GPS triage flow
    │   ├── dashboard/         # Municipal LGU map & maintenance dispatch center
    │   └── api/
    │       └── triage/        # Server-side Gemini multimodal analysis endpoint
    └── lib/
        ├── utils.ts           # Helper functions (cn, styling helpers)
        ├── server/            # Server-only utilities (Gemini client, DB client)
        └── components/
            └── ui/            # shadcn-svelte UI components (button, card, dialog, etc.)
```
