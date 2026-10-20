# SuriOS — System Architecture & Data Flow

This document details the end-to-end system architecture, service interactions, data flow, and infrastructure design for **SuriOS**.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["📱 Client & Citizen Layer"]
        Citizen["📱 Citizen Mobile Web<br/>(Camera + HTML5 GPS)"]
        Inspector["🔍 Field Inspector Web<br/>(High-Res Image + Survey Data)"]
        Dispatcher["💻 Municipal Command Dashboard<br/>(Interactive GIS Map + Ticket Queue)"]
    end

    subgraph Edge["☁️ Edge & Security Layer (Cloudflare)"]
        CF["☁️ Cloudflare CDN & DNS<br/>(Instant Edge SSL/HTTPS, DDoS Shield)"]
        Nginx["🛡️ Nginx Reverse Proxy (Azure VM)<br/>(Subdomain Routing to Port 3000)"]
    end

    subgraph AppServer["⚡ Application Layer (SvelteKit 3 / Node 22)"]
        SSR["🎨 SSR & SPA Router (Svelte 5 Runes)"]
        API["⚡ Server API Routes (/api/triage)"]
        FormAction["📝 Form Actions (Progressive Enhancement)"]
        TriageEngine["🧠 Gemini Triage Client (@google/genai)"]
    end

    subgraph ExternalAI["✨ Intelligence Layer (Google Cloud)"]
        Gemini["🧠 Google Gemini 3.5 Flash<br/>(ASTM D6433 + Two-Wheeler Lethality Index)"]
        FallbackGemini["🤖 Gemini 3.5 Flash Lite<br/>(Zero-Downtime Fallback Model)"]
    end

    subgraph StorageLayer["💾 Data & Persistence Layer"]
        Drizzle["💧 Drizzle ORM (Type-Safe Query Client)"]
        Postgres[("🐘 PostgreSQL 16 Alpine<br/>(Reports, Geo-Coords, Triage JSONB, Status)")]
        LocalDisk[("💾 Docker Storage Volume<br/>(Uploaded Road Imagery in static/uploads)")]
    end

    Citizen -->|"HTTPS (Multipart Form + GPS)"| CF
    Inspector -->|"HTTPS (Survey Payload)"| CF
    Dispatcher -->|"HTTPS (Map & Ticket Actions)"| CF

    CF -->|"Proxied Traffic"| Nginx
    Nginx -->|"Proxy Pass (Port 3000)"| AppServer

    FormAction -->|"Save Image File"| LocalDisk
    API -->|"Save Image File"| LocalDisk
    API -->|"Send Buffer + Prompt"| TriageEngine
    TriageEngine -->|"Primary API Call"| Gemini
    Gemini -.->|"Auto-Fallback on Demand"| FallbackGemini
    Gemini -->|"Structured JSON Schema"| TriageEngine
    TriageEngine -->|"Insert Record via"| Drizzle
    Drizzle -->|"Persist Ticket"| Postgres

    Dispatcher <-->|"Query Tickets & Mutate Status"| API
    API <-->|"Fetch GeoJSON & Coordinates"| Drizzle
```

---

## 2. Core Subsystems

### A. 📱 Citizen & Field Capture Layer (Mobile Web)
* **⚡ Progressive Mobile Web:** Built with Svelte 5 and Tailwind CSS v4, optimized for mobile viewports (`sm:`).
* **📸 Direct Hardware Capture:** Integrates `<input type="file" capture="environment">` for immediate rear-camera access on mobile devices.
* **📍 Geolocation Ingestion:** Uses the browser `navigator.geolocation` API to capture precise latitude, longitude, and accuracy radius.
* **🏍️ Two-Wheeler Lethality Alert:** Instant visual warning banner notifying citizens if the road defect is a lethal hazard for motorcycles, tricycles, and bicycles.

### B. 🛠️ Application & Orchestration Layer (SvelteKit 3)
* **⚡ Svelte 5 Runes Reactivity:** `$state`, `$derived`, and `$effect` power surgical DOM updates with zero Virtual DOM overhead.
* **🚀 Production Node Adapter:** Built with `@sveltejs/adapter-node` compiling into a standalone Node server (`build/index.js`).
* **🔒 Server-Side Key Shielding:** Environment variables (`GEMINI_API_KEY`) are accessed strictly on the server via `$env/static/private` or Node process environment.

### C. 🧠 Intelligence & Vision Layer (Google Gemini)
* **✨ Models:** Primary `gemini-3.5-flash` with automatic fallback to `gemini-3.5-flash-lite` via `@google/genai`.
* **📊 ASTM D6433 Standards:** Formal civil distress classification (*pothole, alligator cracking, longitudinal cracking, rutting, ravelling, drainage failure*).
* **🛡️ Spam & Anti-Abuse Rejection:** Instant binary rejection for non-infrastructure imagery (e.g., indoor rooms, pets, selfies, food).
* **🏍️ Two-Wheeler Lethality Index (SDG 9.1):** Evaluates hazard rating (*NONE, LOW, MODERATE, HIGH, CRITICAL*) specifically for vulnerable road users (60%+ of Philippine road transport).
* **🔧 Action & Materials Estimation:** Recommends exact public works repair methods and generates a crew equipment checklist.

### D. 🐘 Data & Storage Layer (PostgreSQL + Drizzle ORM)
* **💧 Drizzle ORM Schema:**
  * `id`: UUID primary key (`defaultRandom()`).
  * `image_path`: Relative file path inside `static/uploads/`.
  * `latitude` & `longitude`: High-precision decimals (`DECIMAL(10, 8)` / `DECIMAL(11, 8)`).
  * `distress_type`: Standardized civil category (`pothole`, `alligator_cracking`, etc.).
  * `hazard_severity`: Integer rating from `1` to `10`.
  * `risk_level`: General risk tier (`LOW`, `MODERATE`, `CRITICAL`).
  * `vru_lethality`: Rider threat level (`NONE` to `CRITICAL`).
  * `vru_details`: Kinematic hazard explanation for two-wheelers.
  * `recommended_action`: Repair specification.
  * `materials_checklist`: `JSONB` array of required crew equipment.
  * `status`: Lifecycle enum (`REPORTED`, `DISPATCHED`, `RESOLVED`).
  * `community_confirmations`: Counter for proximity-linked citizen upvotes (~25m).
  * `resolved_image_path`: After-repair photo for Gemini "Proof of Patch" verification.
  * `triage_payload`: Full structured Gemini JSON document.
  * `created_at` & `updated_at`: UTC timestamps.

### E. 💻 Municipal Command Dashboard
* **🗺️ Interactive GIS Mapping:** Leaflet or MapLibre GL mounted cleanly inside a Svelte 5 `$effect()` block.
* **📍 Severity Color Clustering:**
  * 🟢 **Green (1–3):** Minor surface degradation (monitoring queue).
  * 🟡 **Amber (4–6):** Moderate structural defect (scheduled maintenance).
  * 🔴 **Red (7–10):** Critical safety hazard / deep pothole (emergency dispatch).
* **📋 Ticket Management Drawer:** Slide-over sheet (`shadcn-svelte`) showing original photo, AI distress diagnosis, materials checklist, and dispatch controls.

---

## 3. Infrastructure & Deployment Topology

```mermaid
flowchart LR
    Internet((🌐 Public Internet)) -->|"HTTPS (Port 443)"| CF["☁️ Cloudflare Edge CDN<br/>(Universal SSL, DDoS Shield)"]
    CF -->|"Proxied Traffic (HTTP/HTTPS)"| AzureVM["🖥️ Ubuntu Azure VM (Standard_B2s)"]

    subgraph DockerCompose["🐳 Docker Compose Network"]
        AppContainer["⚡ SuriOS Web Container<br/>(Node 22 / SvelteKit, Port 3000)"]
        DBContainer["🐘 PostgreSQL Container<br/>(Data Volume, Internal Port 5432)"]
    end

    AzureVM -->|"Port 3000"| AppContainer
    AppContainer -->|"Internal Network"| DBContainer
```

* **☁️ Cloudflare:** DNS and Edge SSL proxy for `https://surios.site`.
* **🖥️ Azure Virtual Machine:** Ubuntu 24.04 LTS instance hosting multi-container Docker network.
* **🐳 Docker Compose:** Isolated production environment (`docker-compose.prod.yml`).
