# SuriOS — UI/UX Design System Specification
**SDG 9 Municipal Civil Infrastructure & Vulnerable Road User Safety Platform**

---

## 1. Zero AI-Slop Design Charter

SuriOS rejects all forms of generic, over-stylized "AI slop" in favor of the authentic, austere, institutional craft of **shadcn-ui**.

### The Non-Negotiable Directives:
1. **🚫 Strictly NO Gradients:**
   * **Rule:** No background radial gradients, no linear gradient cards, no gradient borders, and no gradient text fills (`bg-gradient-to-...` is strictly forbidden).
   * **Justification:** Real municipal civil engineering telemetry and institutional dispatch software use flat, clean, solid surfaces. Gradients look like uncurated marketing templates and decrease contrast under outdoor tropical sunlight.
2. **🚫 Strictly NO Excessive / Glowing Shadows:**
   * **Rule:** No neon-colored drop shadows (`shadow-emerald-500/20`), no blurry elevation, and no glowing borders.
   * **Affordance:** Surfaces are articulated cleanly and crisply using subtle 1px border strokes (`border border-border`) and matte surface elevation (`bg-card`, `bg-secondary`).
3. **✨ Soft Typography (Anti-"Nerd Font" Policy):**
   * **Rule:** The primary interface font is a soft, human, highly legible modern sans-serif stack (**Inter / system-ui**).
   * **Monospace Usage:** Monospace typography (`font-mono`) is strictly quarantined to technical data values where fixed-width alignment is functionally necessary: geodetic coordinates (`14.2813° N, 121.4173° E`), ASTM standard codes (`ASTM-D6433-20`), and municipal ticket IDs (`#TKT-7821`). The rest of the UI uses clean, gentle, soft typography.
4. **🌓 Dual-Mode Equality (Light & Dark Parity):**
   * Both Dark Mode and Light Mode are first-class citizens.
   * Every component is mapped to semantic OKLCH CSS variables, ensuring 100% visual contrast and aesthetic beauty in bright Philippine daylight as well as night road operations.

---

## 2. Visual Reference & Gold Standard

SuriOS visual design is directly modeled after the official shadcn-ui gold standard:
* **Dark Mode Foundation:** Deep matte black foundation (`#09090b` / `oklch(0.1 0 0)`), elevated card surfaces (`#18181b` / `oklch(0.135 0 0)`), crisp micro-borders (`#27272a` / `oklch(0.23 0 0)`), and soft white text (`#fafafa`).
* **Light Mode Foundation:** Pure white canvas (`#ffffff`), soft zinc elevated cards (`#ffffff` / `#fcfcfc`), soft borders (`#e4e4e7`), and deep charcoal text (`#09090b`).
* **Micro-Affordances:** Rounded corners (`rounded-xl` and `rounded-2xl`), pill badges, segmented tab switchers, and subtle status dots (`● Connected`).

---

## 3. Component Architecture: shadcn-svelte & Bits UI

SuriOS standardizes on **shadcn-svelte** built on top of **Bits UI** primitives and **Tailwind CSS v4**'s CSS-first `@theme` engine.

```
┌────────────────────────────────────────────────────────┐
│               SuriOS Domain Views                      │
│   (/ [Triage], /report [Field], /dashboard [GIS Map])  │
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

### Component Catalog (`$lib/components/ui/`)

| Component | Path | Purpose |
| :--- | :--- | :--- |
| **`Card`** | `$lib/components/ui/card` | Flat matte surfaces for evidence capture, KPI statistics, and triage telemetry. |
| **`Button`** | `$lib/components/ui/button` | Flat action triggers (`default`, `secondary`, `outline`, `ghost`, `destructive`). |
| **`Badge`** | `$lib/components/ui/badge` | ASTM distress codes, severity tiers, and status pills. |
| **`Tabs`** | `$lib/components/ui/tabs` | Segmented tab views (`Overview`, `ASTM Telemetry`, `Materials & Dispatch`). |
| **`Sheet`** | `$lib/components/ui/sheet` | Slide-over drawer for municipal maintenance work orders. |
| **`Dialog`** | `$lib/components/ui/dialog` | Gemini "Proof of Patch" inspection modals. |
| **`Alert`** | `$lib/components/ui/alert` | High-contrast Two-Wheeler Lethality warnings. |
| **`Separator`** | `$lib/components/ui/separator` | 1px horizontal and vertical dividing rules. |

---

## 4. Color Tokens (OKLCH Semantic Palette)

| Token Name | Light Value | Dark Value | SuriOS Meaning |
| :--- | :--- | :--- | :--- |
| **`--background`** | `oklch(1 0 0)` (#fff) | `oklch(0.1 0 0)` (#09090b) | Primary canvas background. |
| **`--card`** | `oklch(1 0 0)` (#fff) | `oklch(0.135 0 0)` (#18181b) | Elevated card surface. |
| **`--border`** | `oklch(0.91 0 0)` (#e4e4e7) | `oklch(0.23 0 0)` (#27272a) | 1px structural micro-border. |
| **`--primary`** | `oklch(0.145 0 0)` (#09090b)| `oklch(0.985 0 0)` (#fafafa) | Solid primary buttons & brand accent. |
| **`--destructive`** | `oklch(0.577 0.245 27.3)` | `oklch(0.55 0.22 25)` | Two-Wheeler Lethality & Critical Road Hazards. |
| **`--muted`** | `oklch(0.965 0 0)` | `oklch(0.18 0 0)` | Subdued pill badges, secondary surfaces. |

---

## 5. Field Usability & Accessibility Standards

* **Minimum 48px Touch Targets:** Buttons and triggers maintain a $\ge 48\text{px} \times 48\text{px}$ touch boundary for one-handed operation by motorcycle riders or DPWH inspectors wearing gloves.
* **WCAG 2.1 AA Contrast Compliance:** All text has $\ge 4.5:1$ contrast against card backgrounds in both light and dark modes.
* **Zero Layout Shift:** Rigid aspect-ratio containers (`aspect-video`) prevent screen jitter when camera images are loaded.
