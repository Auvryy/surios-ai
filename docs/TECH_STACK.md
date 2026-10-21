# SuriOS — Technology Stack Specification

This document provides the definitive specification of the technical stack powering **SuriOS**, including exact package versions, architectural justifications, and engineering trade-offs.

---

## 1. Stack Overview & Version Matrix

| Layer | Technology | Version / Scope | Primary Architectural Advantage |
| :--- | :--- | :--- | :--- |
| **⚡ Frontend Framework** | **Svelte 5** | `^5.57.1` | Runes reactive primitives (`$state`, `$derived`, `$effect`, `$props`, `$bindable`); compiled surgical DOM updates; tiny mobile bundle. |
| **🛠️ Meta-Framework** | **SvelteKit** | `^3.0.0` | Full-stack TypeScript runtime; progressive form enhancement (`use:enhance`); server hooks (`hooks.server.ts`). |
| **🚀 Production Adapter** | **`@sveltejs/adapter-node`** | `^6.0.0` | Compiles into a standalone production Node server (`build/index.js`) for Docker deployment. |
| **🎨 Styling Engine** | **Tailwind CSS v4** | `^4.3.0` | CSS-first engine with semantic OKLCH theme variables (`--background`, `--card`, `--border`) for instant dark/light parity. |
| **🧱 UI Component System** | **shadcn-svelte** (Bits UI) | `bits-ui ^2.19.5` | Accessible, flat matte institutional civic-tech primitives (`Card`, `Sheet`, `Tabs`, `Dialog`, `Badge`, `Alert`, `EmptyState`). |
| **🗺️ Spatial GIS Engine** | **Leaflet + Carto Voyager** | `^1.9.4` | Lightweight client-side GIS mapping with high-contrast vector tiles and custom numeric severity markers. |
| **🧠 AI Multimodal Vision** | **Google Gemini API** | `gemini-flash-lite-latest` | Sub-2-second multimodal vision inference with automatic fallback to `gemini-flash-latest` and `gemini-3.8-flash`. |
| **🤖 AI Client SDK** | **`@google/genai`** | `^2.30.0` | Official first-party Google GenAI SDK with native `responseMimeType: 'application/json'`. |
| **📐 Schema Validation** | **Zod** | `^4.6.7` | Strict runtime validation and resilient `.default()` normalization for AI JSON outputs and form payloads. |
| **🔐 Auth & Cryptography** | **Node Native Crypto** | `node:crypto` (`scrypt`) | Salted 64-byte `scryptSync` password hashing + `timingSafeEqual` verification; zero external C++ build dependencies. |
| **🐘 Relational Database** | **PostgreSQL** | `16-alpine` | ACID persistence for `users`, `sessions`, and `reports` with native `JSONB` storage for full Gemini triage payloads. |
| **💧 Type-Safe ORM** | **Drizzle ORM & Kit** | `^0.45.4` / `^0.31.11` | Zero-binary-overhead TypeScript SQL builder and declarative schema migrations (`drizzle-kit generate` / `push`). |
| **✨ Iconography** | **`@lucide/svelte`** | `^1.59.0` | Clean 2px stroke SVG iconography across sidebar navigation, hazard alerts, and civil engineering tools. |
| **🐳 Container & Cloud** | **Docker Compose + Azure VM** | Ubuntu 24.04 LTS | Isolated multi-container deployment (`surios_web_prod`, `surios_db_prod`) behind Nginx & Cloudflare Universal SSL. |

---

## 2. Deep-Dive Architectural Decisions

### A. ⚡ Why Svelte 5 (Runes) over React / Next.js
1. **Low-End Smartphone Performance:** Field inspectors and commuters in provincial corridors often operate budget Android devices on unstable 4G connections. Svelte 5 compiles away framework runtime overhead, delivering near-instant time-to-interactive.
2. **Deterministic Reactivity:** Runes (`$state`, `$derived`, `$effect`) eliminate React's stale closures and dependency array bugs.
3. **Frictionless Leaflet GIS Lifecycle:** Mounting and cleaning up imperative DOM libraries like Leaflet inside a single `$effect(() => { ... return () => map.remove(); })` block is clean, leak-free, and SSR-safe.

### B. 🔐 Why Native `node:crypto` + Drizzle Sessions over Third-Party Auth SaaS
1. **Zero External Vendor Lock-In or Outages:** Municipal emergency dispatch software must remain operational even if external SaaS auth providers experience downtime.
2. **Docker Alpine Reliability:** Native `node:crypto.scryptSync` and `timingSafeEqual` are built directly into the Node.js binary—avoiding `node-gyp` / C++ compilation failures common with `bcrypt` or `argon2` packages during multi-stage Docker builds.
3. **Instant Demo Readiness:** Our custom `ensureInitialSeedUsers()` hook automatically provisions verified `ENGINEER`, `OFFICER`, and `CITIZEN` test accounts on first boot.

### C. 🧠 Why Multi-Model Fallback in `@google/genai`
1. **High Availability under Free/Tiered Quotas:** `src/lib/server/gemini.ts` implements an ordered fallback loop (`['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash']`). If the primary model encounters a transient rate limit or regional spike, the next model seamlessly fulfills the triage request.
2. **Resilient `.env` Resolution:** `getApiKey()` inspects `process.env.GEMINI_API_KEY` first and includes a direct `.env` file reader fallback so local Vite development and production Docker containers both resolve credentials reliably.
