# Design.md — Visual Design System

## 1. Design Principles

- **Modern, sleek, minimalist** — generous whitespace, few borders, flat surfaces, no unnecessary shadows or gradients.
- **Warm but professional** — the yellow/brown palette should feel warm and approachable without tipping into playful or juvenile; this is still a tool handling HR, performance, and financial data.
- **Clarity over decoration** — this is a data-dense operations tool; managers need to scan and act fast. Brand color is used purposefully (accents, CTAs, active states), not everywhere.
- **Status at a glance** — a separate, consistent status color set (not the brand palette) is used for red/yellow/green alerts, workload, and task status, so brand color and status color never get confused.

## 2. Theme

- **Light theme only for v1** (dark mode deferred to a later phase, but color tokens below are written as CSS variables so dark mode can be added later without a redesign).
- Base is a warm off-white/cream background rather than stark white, to work with the brown/yellow brand palette.

## 3. Color Palette

### Brand Colors

| Token                | Hex       | Usage                                                        |
| -------------------- | --------- | ------------------------------------------------------------ |
| `brand-yellow`       | `#F2B705` | Primary CTAs, active nav item, key highlights, chart accents |
| `brand-yellow-hover` | `#D9A400` | Hover state for yellow buttons/links                         |
| `brand-yellow-light` | `#FDF3D7` | Subtle highlight backgrounds, selected tab/row background    |
| `brand-brown`        | `#4A3A2C` | Headings, primary text on light surfaces, sidebar background |
| `brand-brown-soft`   | `#7A6653` | Secondary text, icons, muted labels                          |
| `brand-brown-light`  | `#C9B8A4` | Borders, dividers, subtle UI accents                         |

### Base / Neutrals

| Token            | Hex       | Usage                                                       |
| ---------------- | --------- | ----------------------------------------------------------- |
| `background`     | `#FFFBF2` | Page background — warm off-white/cream                      |
| `surface`        | `#FFFFFF` | Cards, panels (pure white to lift off the cream background) |
| `surface-muted`  | `#F5EFE3` | Secondary panels, table header background                   |
| `border`         | `#E9DFCB` | Dividers, card borders — warm neutral, not grey             |
| `text-primary`   | `#2E2317` | Main text (deep brown-black, not pure black — keeps warmth) |
| `text-secondary` | `#8A7A66` | Secondary/meta text                                         |

### Status Colors (kept separate from brand palette — never overlap with yellow/brown)

| Token     | Hex       | Meaning                                                                                             |
| --------- | --------- | --------------------------------------------------------------------------------------------------- |
| `success` | `#2F9E44` | On track, approved, green alerts                                                                    |
| `warning` | `#E8590C` | At risk, pending — warm orange, distinct from brand yellow so alerts don't blend into brand accents |
| `danger`  | `#D64545` | Overdue, overloaded, rejected, red alerts                                                           |
| `info`    | `#3B6E91` | Informational, neutral status — muted teal-blue for contrast against the warm palette               |

### Workload Indicator Scale

| Range    | Color              |
| -------- | ------------------ |
| 0–50%    | `success` (green)  |
| 51–80%   | `warning` (orange) |
| 81–100%+ | `danger` (red)     |

> Rule: brand yellow/brown is never reused to signal status (success/warning/danger). This avoids ambiguity between "this is a brand accent" and "this needs your attention."

## 4. Typography

- **Font family:** `Inter` (system-ui fallback) — clean, geometric, highly legible for dense UI and data tables; pairs well with a minimalist warm palette.
- **Headings:** Inter, Semibold — color `brand-brown` (`#4A3A2C`)
- **Body:** Inter, Regular/Medium — color `text-primary`

| Style      | Size | Weight         | Usage                              |
| ---------- | ---- | -------------- | ---------------------------------- |
| Display    | 32px | Semibold       | Landing page hero only             |
| H1         | 24px | Semibold       | Page titles                        |
| H2         | 20px | Semibold       | Section headers                    |
| H3         | 16px | Semibold       | Card titles                        |
| Body       | 14px | Regular        | Default text                       |
| Small/Meta | 12px | Regular/Medium | Timestamps, labels, secondary info |

- Letter-spacing kept tight/default (no wide tracking) to keep the minimalist feel.
- One typeface family throughout the product — no decorative or script fonts anywhere.

## 5. Spacing & Layout

- Base spacing unit: **4px** grid (Tailwind default scale)
- Generous whitespace: card padding 20–24px, section gaps 32px+ on the landing page
- Card padding (app): 16–24px
- Page max content width: 1280px, centered, with a fixed left sidebar (240px, `brand-brown` background with cream/white text) for app navigation
- Landing page: full-width sections with a centered 1200px content container
- Consistent 8px gap between related elements, 24px between distinct sections

## 6. Components (via shadcn/ui, themed to palette above)

- **Cards:** flat, minimal — thin `border` (1px, `#E9DFCB`), no heavy shadow (`shadow-sm` at most), `rounded-xl` (~12px) for a soft modern feel
- **Buttons:**
  - Primary: filled `brand-yellow` background, `brand-brown` text (high contrast, on-brand)
  - Secondary: outline in `brand-brown-light`, `brand-brown` text
  - Destructive: filled `danger`
  - Ghost: text-only, `text-secondary`, for low-emphasis actions
- **Badges/Pills:** used for task/request/workload status — always the status palette (never brand yellow/brown), paired with a text label for accessibility
- **Tables:** no zebra striping; `surface-muted` header row, thin `border`-bottom row separators, sticky header on scroll
- **Charts (Recharts):** workload bars and performance trends use the status palette; any "neutral" data series (e.g., task volume over time) uses `brand-yellow` as the single accent color
- **Sidebar (app shell):** `brand-brown` background, white/cream text, active item highlighted with a `brand-yellow` left-border or a filled `brand-yellow-light` background with `brand-brown` text
- **Modals/Drawers:** side drawer for quick task/employee detail; modal for confirmations and short forms — `surface` background, `border` outline, no heavy backdrop blur (keep it minimal/flat)

## 7. Iconography

- **Icon set:** Lucide (pairs natively with shadcn/ui) — outline style, 1.5px stroke, consistent sizing (16px inline, 20px nav)
- Icons colored `text-secondary` by default; `brand-yellow` or status colors only when the icon itself is conveying meaning (e.g., an alert icon)
- Icons used sparingly — nav, status indicators, empty states — not decoratively inside body copy

## 8. Landing / Marketing Page Specific Guidance

- **Hero section:** cream background, large `brand-brown` headline, `brand-yellow` primary CTA button, minimal supporting illustration or a clean product screenshot mock — no stock photography of people.
- **Feature sections:** simple icon + short heading + one-line description per feature, laid out in a clean 3-column grid (2-column tablet, 1-column mobile) — lots of whitespace, no card borders needed here (flatter than the app UI).
- **FAQ section:** accordion pattern, `brand-brown` question text, `text-secondary` answer text, thin `border` divider between items.
- **Login page:** centered card on a cream background; the two paths ("Company Login" / "Employee Login") shown as two clearly labeled tabs or side-by-side buttons at the top of the card, `brand-yellow` for the active/selected path.

## 9. Alerts & Notification Styling

- Early-warning panel uses a simple traffic-light list format:
  - 🔴 Red = urgent/overdue
  - 🟠 Orange = needs attention soon
  - 🟢 Green = healthy/on track
- Toast notifications: top-right, flat style with `surface` background + thin colored left-border matching status (not a full-colored background), auto-dismiss after 4s for success, persistent for errors until dismissed

## 10. Accessibility

- Minimum contrast ratio AA (4.5:1) for all text — verified specifically for `brand-brown` on `brand-yellow` (used for primary buttons) and `text-secondary` on `background`
- Never rely on color alone to convey status — always pair with text/icon
- All interactive elements keyboard-navigable and focus-visible (focus ring in `brand-yellow` at 2px offset)

## 11. Empty & Loading States

- Empty states include a short friendly message + a clear primary (`brand-yellow`) action (e.g., "No tasks yet — Create your first task")
- Loading states use skeleton loaders (matching the shape of the content, in `surface-muted` tone), not spinners, for dashboard widgets and tables
