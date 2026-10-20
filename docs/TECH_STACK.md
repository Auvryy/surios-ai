# SuriOS — Technology Stack Specification

This document provides the definitive specification of the technical stack chosen for **SuriOS**, along with architectural justifications and decision records.

---

## 1. Stack Overview & Visual Taxonomy

| Category | Selection | Version / Scope | Primary Advantage |
| :--- | :--- | :--- | :--- |
| **⚡ Frontend Framework** | **Svelte 5** | `^5.57.1` | Runes reactive primitives (`$state`, `$derived`, `$effect`); zero Virtual DOM overhead; lightweight mobile bundle. |
| **🛠️ Meta-Framework** | **SvelteKit** | `^3.0.0` | Full-stack TypeScript runtime; progressive enhancement (`use:enhance`); built-in server route isolation. |
| **🚀 Production Adapter** | **`@sveltejs/adapter-node`** | `^6.0.0` | Compiles into a standalone Node server (`build/index.js`) optimized for Docker containers. |
| **🎨 Styling & Design** | **Tailwind CSS v4** | `^4.3.0` | Modern CSS-first engine; zero runtime layout shifts; instant utility styling. |
| **🧱 UI Component System** | **shadcn-svelte** (Bits UI) | `v1.7.0` | Accessible, institutional civic-tech UI components (`card`, `button`, `sheet`, `badge`, `dialog`). |
| **🧠 AI Multimodal Vision** | **Google Gemini** | Model `gemini-3.5-flash` | Sub-second visual inference; ASTM D6433 defect classification; Two-Wheeler Lethality Index scoring. |
| **🤖 AI Client SDK** | **`@google/genai`** | `^2.30.0` | Official first-party Google SDK; native JSON schema support; zero third-party wrapper overhead. |
| **📐 Schema Validation** | **Zod** | `^3.25.0` | Type-safe runtime schema validation for incoming client forms and outgoing AI JSON payloads. |
| **🐘 Relational Database** | **PostgreSQL** | `16-alpine` | High-reliability ACID persistence; native `JSONB` querying for flexible triage payloads; indexed coordinate lookup. |
| **💧 Type-Safe ORM** | **Drizzle ORM** | `^0.45.0` | Zero-overhead TypeScript ORM; instant migrations via `drizzle-kit push`; no heavy binary engines. |
| **✨ Icons System** | **`@lucide/svelte`** | Modern ESM | Crisp, consistent SVG icons for civic, mapping, hazard alerts, and dispatch controls. |
| **🐳 Containerization** | **Docker & Docker Compose** | Engine v27+ | Multi-container isolation for web runtime, database, and reverse proxy. |
| **☁️ Edge DNS & SSL** | **Cloudflare** | Free Tier | Instant automated HTTPS / SSL termination, DDoS protection, and edge CDN caching for `surios.site`. |
| **🖥️ Cloud Hosting** | **Ubuntu Azure VM** | Ubuntu 24.04 LTS | Cloud virtual machine hosting production containers behind custom domain DNS. |

---

## 2. Deep Dive Justifications

### A. ⚡ Why Svelte 5 (Runes) over React / Next.js
1. **Compilation vs. Virtual DOM:** Svelte 5 compiles components directly into surgical DOM updates. On mobile devices with budget processors and low memory, Svelte applications render significantly faster than React equivalents.
2. **Simplified Reactivity:** Modern Runes (`$state`, `$derived`, `$effect`, `$props`) completely eliminate React's dependency array bugs, stale closure traps, and infinite re-render loops.
3. **Clean Native DOM Integration:** Interactive maps (Leaflet / MapLibre) mutate real DOM nodes. Integrating maps into Svelte's `$effect` avoids the lifecycle synchronization nightmares common in React.

### B. 🛠️ Why SvelteKit Full-Stack Architecture
1. **Single Runtime:** Frontend components and backend API endpoints live in the same repository under `src/routes`, sharing TypeScript interfaces directly without code generation.
2. **Zero Page Refreshes:** Client-side routing intercepts page navigation. Form actions use `use:enhance` to submit photos asynchronously without the screen flickering or resetting.
3. **Guaranteed Secret Protection:** SvelteKit strictly isolates server modules (`$env/static/private`). Secret keys like `GEMINI_API_KEY` are impossible to accidentally bundle into client JavaScript.

### C. 🧠 Why `@google/genai` with `gemini-3.5-flash`
1. **Multimodal Performance:** Gemini 3.5 Flash processes road photos with high visual comprehension at low latency and minimal token cost.
2. **Structured JSON Validation:** Gemini natively conforms to specified JSON schemas via `responseSchema`, avoiding brittle regex parsing or JSON extraction failures.
3. **No Unneeded Abstraction:** By utilizing Google's official first-party SDK instead of heavy frameworks (like LangChain), the application remains lightweight, predictable, and simple to debug.

### D. 🐘 Why PostgreSQL with Drizzle ORM
1. **Relational Integrity:** Essential data fields (`id`, `status`, `latitude`, `longitude`, `hazard_severity`, `created_at`) benefit from strict relational indexing, foreign keys, and sorting.
2. **Document Flexibility:** Civil engineering triage metadata (repair checklists, secondary distress notes, dimensions, raw AI reasoning) varies by defect type and is stored cleanly in PostgreSQL's native `JSONB` format without requiring premature database migrations.
3. **Drizzle Performance:** Drizzle has zero binary overhead, starts instantly, and produces 100% type-safe queries that match SvelteKit's speed.

### E. ☁️ Why Cloudflare + Docker on an Azure VM
1. **Instant HTTPS:** Modern mobile browsers strictly disable `navigator.geolocation` over unencrypted HTTP. Cloudflare provides instant Universal SSL at the edge for `https://surios.site`.
2. **Multi-Tenant VM Capacity:** Docker Compose isolates SuriOS on port 3000, allowing the single Azure VM to host multiple projects (like Bagoo and SuriOS) simultaneously without port collisions.
