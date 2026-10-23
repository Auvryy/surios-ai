# SuriOS — UI/UX Design System Specification
**SDG 9 Public Infrastructure Reporting & Response Platform**

---

## 1. Zero AI-Slop Design Charter

SuriOS rejects all forms of generic, over-stylized "AI slop" in favor of the authentic, austere, institutional craft of **shadcn-ui**.

### The 6 Non-Negotiable Directives:
1. **🚫 Strictly NO Gradients:**
   * **Rule:** No background radial gradients, no linear gradient cards, no gradient borders, and no gradient text fills (`bg-gradient-to-...` is strictly forbidden).
   * **Justification:** Real municipal civil engineering telemetry and institutional dispatch software use flat, clean, solid surfaces. Gradients look like uncurated marketing templates and decrease contrast under outdoor tropical sunlight.
2. **🚫 Strictly NO Excessive / Glowing Shadows:**
   * **Rule:** No neon-colored drop shadows (`shadow-emerald-500/20`), no blurry elevation, and no glowing borders.
   * **Affordance:** Surfaces are articulated cleanly and crisply using subtle 1px border strokes (`border border-border`) and matte surface elevation (`bg-card`, `bg-secondary`).
3. **✨ Soft Typography (Anti-"Nerd Font" Policy):**
   * **Rule:** The primary interface font is a soft, human, highly legible modern sans-serif stack (**Inter / system-ui**).
   * **Monospace Usage:** Monospace typography (`font-mono`) is strictly quarantined to technical data values where fixed-width alignment is functionally necessary: geodetic coordinates (`14.2813° N, 121.4173° E`), ASTM standard codes (`ASTM-D6433-24`), and municipal ticket IDs (`TKT-7821`). The rest of the UI uses clean, gentle, soft typography.
4. **🌓 Dual-Mode Equality (Light & Dark Parity):**
   * Both Dark Mode and Light Mode are first-class citizens.
   * Every component is mapped to semantic OKLCH CSS variables, ensuring 100% visual contrast and aesthetic clarity in bright Philippine daylight as well as night road operations.
5. **🚫 NO Status / Green Dots:**
   * **Rule:** Do not use decorative green status dots, pulsing circles, or colored indicator dots (`rounded-full bg-emerald-500`).
   * **Affordance:** System and ticket states are communicated exclusively through clean, quiet badges (`Badge variant="secondary"` or `Badge variant="outline"`) and legible typography—never gimmicky dots.
6. **✂️ Extreme Minimalism & Zero Unnecessary Words:**
   * **Rule:** Strictly eliminate marketing fluff, repetitive sentences, and wordy explanations.
   * **Copy Standard:** Keep all labels, headers, and descriptions terse, functional, and minimal. If a label can be expressed in 2 words instead of a paragraph, use 2 words.

---

## 2. Visual Reference & Application Shell Architecture

SuriOS visual design is modeled directly after the official **shadcn-ui** dashboard standard:
* **Dark Mode Foundation:** Deep matte black foundation (`#09090b` / `oklch(0.1 0 0)`), elevated card surfaces (`#18181b` / `oklch(0.135 0 0)`), crisp micro-borders (`#27272a` / `oklch(0.23 0 0)`), and soft white text (`#fafafa`).
* **Light Mode Foundation:** Pure white canvas (`#ffffff`), soft zinc elevated cards (`#ffffff` / `#fcfcfc`), soft borders (`#e4e4e7`), and deep charcoal text (`#09090b`).
* **Sidebar Application Shell (`src/routes/+layout.svelte`):**
  * **Desktop (`md:flex`):** Persistent `w-64` left vertical sidebar with 1px right border (`border-r border-border bg-card`), grouped navigation links (*Operations & GIS*, *Municipal Modules*, *Standards & Policy*, *Personnel & Account*), quick field triage CTA, and an authenticated user card in the footer.
  * **Mobile (`md:hidden`):** Compact `h-14` sticky top bar with a hamburger trigger opening a left-aligned `<Sheet side="left">` navigation drawer.
  * **Auth Route Exemption:** `/login` and `/register` automatically bypass the sidebar shell to render a distraction-free centered authentication card.

---

## 3. Component Architecture: `shadcn-svelte` & Bits UI

SuriOS standardizes on **shadcn-svelte** built on top of **Bits UI** primitives and **Tailwind CSS v4**'s CSS-first engine.

```
┌────────────────────────────────────────────────────────┐
│               SuriOS Domain Views (10 Routes)          │
│   (/, /dashboard, /report, /verification, /analytics,  │
│    /crews, /community, /docs, /profile, /settings)     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               shadcn-svelte Components                 │
│  Card, Button, Badge, Input, Sheet, Dialog, Tabs,      │
│  Alert, Separator, EmptyState, ThemeToggle             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Bits UI Primitives                  │
│       (Accessible, ARIA-compliant, Headless)           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                Svelte 5 Runes Runtime                  │
│       ($state, $derived, $effect, $props, $bindable)   │
└────────────────────────────────────────────────────────┘
```

### Component Catalog (`$lib/components/`)

| Component | Path | Purpose |
| :--- | :--- | :--- |
| **`Card`** | `$lib/components/ui/card` | Flat matte surfaces (`shadow-none` / `shadow-xs`) for evidence capture, KPI statistics, and triage telemetry. |
| **`Button`** | `$lib/components/ui/button` | Flat action triggers (`default`, `secondary`, `outline`, `ghost`, `destructive`). |
| **`Badge`** | `$lib/components/ui/badge` | ASTM distress codes, RBAC roles (`ENGINEER`, `OFFICER`, `CITIZEN`), and status pills. |
| **`Tabs`** | `$lib/components/ui/tabs` | Segmented tab views in Triage (`Overview`, `ASTM Specs`, `Materials`) and Settings (`Appearance`, `Alerts`, `ASTM`, `Diagnostics`). |
| **`Sheet`** | `$lib/components/ui/sheet` | Slide-over inspection drawer (`side="right"`) and mobile navigation drawer (`side="left"`). |
| **`Dialog`** | `$lib/components/ui/dialog` | Gemini "Proof of Patch" inspection modals. |
| **`Alert`** | `$lib/components/ui/alert` | High-contrast critical infrastructure warnings and authentication error banners. |
| **`Separator`** | `$lib/components/ui/separator` | 1px horizontal and vertical dividing rules (`border-border`). |
| **`EmptyState`** | `$lib/components/ui/empty-state.svelte` | Dashed icon container, phase badge, and planned specification checklist for upcoming modules. |
| **`ThemeToggle`** | `$lib/components/theme-toggle.svelte` | Instant dark/light mode switch persisted to `localStorage('surios-theme')`. |

---

## 4. Color Tokens (OKLCH Semantic Palette)

| Token Name | Light Value | Dark Value | SuriOS Meaning |
| :--- | :--- | :--- | :--- |
| **`--background`** | `oklch(1 0 0)` (`#ffffff`) | `oklch(0.1 0 0)` (`#09090b`) | Primary application canvas background. |
| **`--card`** | `oklch(1 0 0)` (`#ffffff`) | `oklch(0.135 0 0)` (`#18181b`) | Elevated matte card & sidebar surface. |
| **`--border`** | `oklch(0.91 0 0)` (`#e4e4e7`) | `oklch(0.23 0 0)` (`#27272a`) | 1px structural micro-border. |
| **`--primary`** | `oklch(0.145 0 0)` (`#09090b`)| `oklch(0.985 0 0)` (`#fafafa`) | Solid primary buttons & active indicators. |
| **`--destructive`** | `oklch(0.577 0.245 27.3)` | `oklch(0.55 0.22 25)` | Critical infrastructure hazards (`Severity 8–10`). |
| **`--muted`** | `oklch(0.965 0 0)` | `oklch(0.18 0 0)` | Subdued pill badges, secondary surfaces, and input backgrounds. |

---

## 5. Field Usability & Accessibility Standards

* **Minimum Touch Targets:** Interactive controls maintain clear spacing for one-handed operation by motorcycle riders or DPWH inspectors in the field.
* **WCAG 2.1 AA Contrast Compliance:** All text maintains $\ge 4.5:1$ contrast against card backgrounds in both light and dark modes.
* **Zero Layout Shift:** Fixed aspect-ratio containers (`aspect-video`) prevent screen jitter when camera evidence previews are loaded.
