# SuriOS — UI/UX Design System Specification
**SDG 9 Municipal Civil Infrastructure & Vulnerable Road User Safety Platform**

---

## 1. Design Philosophy & Civic-Tech Vision

**SuriOS** bridges the gap between field citizen reporting and municipal maintenance operations (LGUs / DPWH). The design system must serve two distinct user environments:
1. **The Field Environment (Riders & Citizen Inspectors):** High-glare tropical sunlight, vibration, and one-handed operation on mobile devices while wearing motorcycle gloves or standing roadside.
2. **The Operations Center (Municipal Dispatchers & Civil Engineers):** Dense, multi-screen GIS mapping environments requiring instant visual triage, zero cognitive clutter, and high-contrast alert hierarchies.

### Core Visual Principles
* **Institutional Authority without Bureaucracy:** Clean, austere, data-dense layouts reminiscent of high-precision aerospace and civil telemetry software, rather than generic SaaS.
* **Vulnerable Road User (VRU) Priority Hierarchy:** Fatal road hazards (potholes, rutting, alligator cracks) for two-wheelers (motorcycles, scooters, tricycles) are instantly flagged with unmissable crimson/amber visual affordances.
* **Radical Clarity in Evidence:** Civil work orders require incontrovertible proof. Every defect displays ASTM D6433 distress codes, geodetic coordinates, and Gemini AI confidence telemetry.

---

## 2. Component Architecture: shadcn-svelte & Bits UI

SuriOS standardizes on **shadcn-svelte** built on top of **Bits UI** primitives and **Tailwind CSS v4**'s CSS-first `@theme` engine.

```
┌────────────────────────────────────────────────────────┐
│               SuriOS Domain Views                      │
│   (/report, /dashboard, /api/triage visualizer)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               shadcn-svelte Components                 │
│  Card, Button, Badge, Input, Sheet, Dialog, Tabs,      │
│  Alert, Separator (Accessible, Styled via Tailwind v4) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Bits UI Primitives                  │
│       (Accessible, ARIA-compliant, Headless)           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                Svelte 5 Runes Runtime                  │
│       ($state, $derived, $props, $bindable)            │
└────────────────────────────────────────────────────────┘
```

### Installed UI Component Catalog (`$lib/components/ui/`)

| Component | Path | SuriOS Use Case |
| :--- | :--- | :--- |
| **`Card`** | `$lib/components/ui/card` | Triage results container, defect telemetry widgets, photo preview frames. |
| **`Button`** | `$lib/components/ui/button` | "Run AI Civil Triage", "Acquire GPS", "Dispatch Crew", camera triggers. |
| **`Badge`** | `$lib/components/ui/badge` | ASTM D6433 distress pills, Severity gauges (1–10), Status flags (`REPORTED`, `DISPATCHED`, `RESOLVED`). |
| **`Input`** | `$lib/components/ui/input` | Coordinate overrides, search bars, dispatcher notes. |
| **`Alert`** | `$lib/components/ui/alert` | Urgent Two-Wheeler Lethality & Rider Safety warnings. |
| **`Sheet`** | `$lib/components/ui/sheet` | Slide-over Municipal Maintenance Dispatch Drawer on the GIS map. |
| **`Dialog`** | `$lib/components/ui/dialog` | Gemini "Proof of Patch" verification modal and high-res image inspector. |
| **`Tabs`** | `$lib/components/ui/tabs` | Switching between Triage Overview, Materials Checklist, and Raw Telemetry. |
| **`Separator`** | `$lib/components/ui/separator` | Clean horizontal/vertical dividing lines between civic data sections. |

---

## 3. Color Tokens & Theme Architecture

SuriOS uses an **OKLCH-based Dark-First Civic Theme** configured via Tailwind CSS v4 `@theme inline` in `src/routes/layout.css`.

### Semantic Color Palette

| Token Name | OKLCH Value / Hex | Usage in SuriOS |
| :--- | :--- | :--- |
| **Background** | `oklch(0.13 0.012 250)` | Deep midnight slate foundation for maximum contrast and low OLED battery draw. |
| **Card Surface** | `oklch(0.16 0.015 250)` | Elevated surfaces for triage panels and telemetry cards. |
| **Border / Stroke**| `oklch(0.25 0.015 250)` | Subtle, crisp separation lines (`border-border`). |
| **Primary (SDG 9)**| `oklch(0.65 0.18 160)` | **Emerald Transit Green:** Primary CTAs, approved dispatch actions, verified patches. |
| **Destructive / Lethal** | `oklch(0.55 0.22 25)` | **Crimson Alert:** High/Critical Two-Wheeler Lethality, potholes $>50$mm deep. |
| **Warning / Moderate** | `oklch(0.75 0.16 65)` | **Civil Amber:** Moderate distress (alligator cracking, block cracking, ravelling). |
| **Corridor Anchor** | `oklch(0.78 0.12 220)` | **Laguna Provincial Sky:** LSPU Santa Cruz Anchor, telemetry indicators, GPS locks. |
| **Muted Text** | `oklch(0.65 0.015 250)` | Secondary labels, timestamp metadata, ASTM reference notes. |

---

## 4. Typography & Numerical Data Display

SuriOS adopts a strict dual-font typographic hierarchy:

1. **System Interface Sans-Serif (`font-sans`):** 
   * Used for page titles, instructions, action buttons, and descriptive explanations.
   * High x-height, optimized for micro-legibility at 12px–16px on mobile viewports.
2. **Tabular Monospace (`font-mono`):**
   * **Mandatory** for all telemetry, coordinates, and classification identifiers:
     * Geodetic Coordinates: `14.281300° N, 121.417300° E`
     * ASTM Distress Codes: `ASTM-D6433: POTHOLE (SEV-HIGH)`
     * Two-Wheeler Lethality Scores: `VRU-INDEX: 9.4/10.0 [CRITICAL]`
     * Municipal Ticket UUIDs: `TKT-8f2a-71b0`

---

## 5. Mobile & Field Usability Standards

* **Touch Target Size:** Every interactive trigger (camera shutter, upload area, GPS lock, dispatch button) has a minimum touch bounding box of **$48\text{px} \times 48\text{px}$** to allow effortless interaction while wearing gloves or holding a phone with one hand.
* **Contrast Compliance:** All text and critical UI elements adhere to **WCAG 2.1 AA** standards ($\ge 4.5:1$ contrast ratio against background surfaces).
* **Responsive Breakpoints:**
  * **Mobile (< 768px):** Single-column stacked workflow. Camera capture $\rightarrow$ GPS verification $\rightarrow$ Inline triage report.
  * **Desktop / Operations Center ($\ge$ 1024px):** Split-view GIS canvas on left with slide-over or persistent triage & dispatch drawer on right.

---

## 6. Svelte 5 Rune Design Standards

All UI components and route pages in SuriOS must adhere to Svelte 5 Runes:
* State must use `$state()` or `$state.raw()` for complex immutable objects.
* Derived computed values (severity color classes, formatted coordinates) must use `$derived()`.
* Component properties must use `$props()` destructuring with explicit TypeScript types.
* Two-way bindings (like inputs or sheets) must use `$bindable()`.
* **Zero tolerance** for deprecated Svelte 3/4 paradigms (`writable()`, `export let`, or reactive assignments `$: `).
