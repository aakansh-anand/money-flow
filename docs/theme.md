# Theming & Design Tokens — Kosh Web

Design tokens for `apps/web` — shadcn **mist** preset (OKLCH) in `apps/web/app/globals.css`. See [README.md](./README.md) (**THEME-1**–**THEME-3**). Sections **4–7** cover radius, layout, motion, and components in the mist style used in this repo.

---

## Architecture

- **Tailwind CSS v4** with `@theme inline` maps CSS variables to utilities (`bg-background`, `text-primary`, …).
- **Light mode:** `:root`
- **Dark mode:** `.dark` on `<html>` (via `next-themes`, `attribute="class"`)
- **Reskin:** change variables in `globals.css` only — not per-component hex (**THEME-3**).

---

## Semantic color tokens

Use Tailwind classes tied to these variables. Do **not** hardcode hex/rgb in components for surfaces, text, or borders (**THEME-1**).

| CSS variable | Tailwind examples | Role |
| --- | --- | --- |
| `--background` | `bg-background` | Page canvas |
| `--foreground` | `text-foreground` | Primary text |
| `--card` | `bg-card` | Cards, elevated panels |
| `--card-foreground` | `text-card-foreground` | Text on cards |
| `--popover` | `bg-popover` | Popovers, dropdown surfaces |
| `--popover-foreground` | `text-popover-foreground` | Text on popovers |
| `--primary` | `bg-primary`, `text-primary` | Primary actions, emphasis links |
| `--primary-foreground` | `text-primary-foreground` | Text on primary fills |
| `--secondary` | `bg-secondary` | Secondary buttons, chips |
| `--secondary-foreground` | `text-secondary-foreground` | Text on secondary |
| `--muted` | `bg-muted` | Subtle fills, hover rails |
| `--muted-foreground` | `text-muted-foreground` | Labels, hints, timestamps |
| `--accent` | `bg-accent` | Active nav, selected rows |
| `--accent-foreground` | `text-accent-foreground` | Text on accent |
| `--destructive` | `bg-destructive`, `text-destructive` | Errors, delete, negative money |
| `--border` | `border-border` | Dividers, table borders |
| `--input` | `border-input` | Input borders |
| `--ring` | `ring-ring`, `outline-ring/50` | Focus rings |
| `--chart-1` … `--chart-5` | `text-chart-3`, etc. | Charts, secondary data emphasis |
| `--sidebar` … `--sidebar-ring` | `bg-sidebar`, … | Sidebar shell (if used) |

Both **light** (`:root`) and **dark** (`.dark`) define every token above (**THEME-2**).

---

## Light (`:root`) — OKLCH values

| Token | Value |
| --- | --- |
| `--background` | `oklch(1 0 0)` |
| `--foreground` | `oklch(0.148 0.004 228.8)` |
| `--card` | `oklch(1 0 0)` |
| `--card-foreground` | `oklch(0.148 0.004 228.8)` |
| `--popover` | `oklch(1 0 0)` |
| `--popover-foreground` | `oklch(0.148 0.004 228.8)` |
| `--primary` | `oklch(0.218 0.008 223.9)` |
| `--primary-foreground` | `oklch(0.987 0.002 197.1)` |
| `--secondary` | `oklch(0.963 0.002 197.1)` |
| `--secondary-foreground` | `oklch(0.218 0.008 223.9)` |
| `--muted` | `oklch(0.963 0.002 197.1)` |
| `--muted-foreground` | `oklch(0.56 0.021 213.5)` |
| `--accent` | `oklch(0.963 0.002 197.1)` |
| `--accent-foreground` | `oklch(0.218 0.008 223.9)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` |
| `--border` | `oklch(0.925 0.005 214.3)` |
| `--input` | `oklch(0.925 0.005 214.3)` |
| `--ring` | `oklch(0.723 0.014 214.4)` |
| `--chart-1` | `oklch(0.872 0.007 219.6)` |
| `--chart-2` | `oklch(0.56 0.021 213.5)` |
| `--chart-3` | `oklch(0.45 0.017 213.2)` |
| `--chart-4` | `oklch(0.378 0.015 216)` |
| `--chart-5` | `oklch(0.275 0.011 216.9)` |
| `--sidebar` | `oklch(0.987 0.002 197.1)` |
| `--sidebar-foreground` | `oklch(0.148 0.004 228.8)` |
| `--sidebar-primary` | `oklch(0.218 0.008 223.9)` |
| `--sidebar-primary-foreground` | `oklch(0.987 0.002 197.1)` |
| `--sidebar-accent` | `oklch(0.963 0.002 197.1)` |
| `--sidebar-accent-foreground` | `oklch(0.218 0.008 223.9)` |
| `--sidebar-border` | `oklch(0.925 0.005 214.3)` |
| `--sidebar-ring` | `oklch(0.723 0.014 214.4)` |

---

## Dark (`.dark`) — OKLCH values

| Token | Value |
| --- | --- |
| `--background` | `oklch(0.148 0.004 228.8)` |
| `--foreground` | `oklch(0.987 0.002 197.1)` |
| `--card` | `oklch(0.218 0.008 223.9)` |
| `--card-foreground` | `oklch(0.987 0.002 197.1)` |
| `--popover` | `oklch(0.218 0.008 223.9)` |
| `--popover-foreground` | `oklch(0.987 0.002 197.1)` |
| `--primary` | `oklch(0.925 0.005 214.3)` |
| `--primary-foreground` | `oklch(0.218 0.008 223.9)` |
| `--secondary` | `oklch(0.275 0.011 216.9)` |
| `--secondary-foreground` | `oklch(0.987 0.002 197.1)` |
| `--muted` | `oklch(0.275 0.011 216.9)` |
| `--muted-foreground` | `oklch(0.723 0.014 214.4)` |
| `--accent` | `oklch(0.275 0.011 216.9)` |
| `--accent-foreground` | `oklch(0.987 0.002 197.1)` |
| `--destructive` | `oklch(0.704 0.191 22.216)` |
| `--border` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(1 0 0 / 15%)` |
| `--ring` | `oklch(0.56 0.021 213.5)` |
| `--chart-1` | `oklch(0.872 0.007 219.6)` |
| `--chart-2` | `oklch(0.56 0.021 213.5)` |
| `--chart-3` | `oklch(0.45 0.017 213.2)` |
| `--chart-4` | `oklch(0.378 0.015 216)` |
| `--chart-5` | `oklch(0.275 0.011 216.9)` |
| `--sidebar` | `oklch(0.218 0.008 223.9)` |
| `--sidebar-foreground` | `oklch(0.987 0.002 197.1)` |
| `--sidebar-primary` | `oklch(0.488 0.243 264.376)` |
| `--sidebar-primary-foreground` | `oklch(0.987 0.002 197.1)` |
| `--sidebar-accent` | `oklch(0.275 0.011 216.9)` |
| `--sidebar-accent-foreground` | `oklch(0.987 0.002 197.1)` |
| `--sidebar-border` | `oklch(1 0 0 / 10%)` |
| `--sidebar-ring` | `oklch(0.56 0.021 213.5)` |

---

## Money amounts (`SignedAmount`)

Map tones to **existing** tokens only (no PRD-only greens/reds outside the palette):

| Tone | Class | Typical use |
| --- | --- | --- |
| `income` | `text-foreground` | Income (pair with `+` prefix) |
| `expense` | `text-destructive` | Expenses (pair with `−`) |
| `investment` | `text-chart-3` | Investment totals / values |
| `lending` | `text-primary` | Owed to you |
| `borrowed` | `text-destructive` | You owe |
| `neutral` | `text-foreground` | Balances, unsigned |
| `warning` | `text-chart-4` | Due / caution |

User-defined **tag** swatches from the API (`tagColor`) may use inline `backgroundColor` — that is user data, not app chrome.

---

## 4. Radius & spacing (mist)

Mist keeps corners **soft but not bubbly**: base `--radius: 0.625rem`, scaled in `@theme inline` (shadcn v4 preset).

| Mist pattern | Classes | Notes |
| --- | --- | --- |
| Controls | `rounded-md` | Buttons, inputs, selects — matches `components/ui/*` |
| Surfaces | `rounded-xl border border-border bg-card shadow-sm` | Dashboard cards, settings blocks |
| Dense UI | `rounded-sm` / `rounded-md` | Tags, step pills, table chrome |
| Empty states | `rounded-xl border border-dashed border-border bg-muted/30` | Low-contrast fill, not a second card color |

**Light mist:** cards sit on `bg-background` with crisp `border-border`. **Dark mist:** same structure; borders use translucent white (`oklch(1 0 0 / 10%)`) so elevation reads as depth, not new hex.

Vertical rhythm: `gap-4` / `gap-6` between sections; card innards `p-6` (see `CardContent`). Shell padding `px-4 py-4` → `sm:px-6 lg:p-8`.

**Typography (mist stack):** `Figtree` → `--font-sans` (body, UI); `Merriweather` → `--font-heading` (display headings when used); `Geist Mono` → `--font-mono` (amounts / codes). Body: `bg-background text-foreground font-sans` in `@layer base`.

---

## 5. Mobile & breakpoints (mist layout)

Mist UI stays **neutral and readable** at every width — no separate “mobile palette,” only layout shifts.

| Breakpoint | Mist behavior |
| --- | --- |
| `< lg` | `bg-card/95` bottom bar + `border-t border-border`; sticky header `bg-background/95 backdrop-blur` |
| `lg+` | Sidebar `bg-card` + `border-r border-border`; active route `bg-accent text-accent-foreground` |
| `sm+` | Home stats `sm:grid-cols-2`; form actions row (`flex-col-reverse sm:flex-row`) |
| Tables | Wrapper `overflow-x-auto rounded-xl border border-border`; header row `bg-muted/50 text-muted-foreground` |

Finance tables stay mist-styled in scroll regions: same border token, no alternate gray hex.

---

## 6. Motion (mist — calm, not flashy)

Mist motion is **short and low-amplitude** so slate surfaces feel stable.

- Install: `motion` in `apps/web`; import only from `motion/react`.
- **Page enter:** `PageMotion` — opacity + ~10px `y`, ~0.28s ease-out (`components/page-motion.tsx`).
- **Dashboard cards:** `Stagger` / `StaggerItem` — small stagger (~0.06s), 12px lift; fits home stat cards on `bg-card`.
- **Mobile nav:** optional `layoutId` spring on an `bg-accent` pill — active state matches static mist accent, not a separate accent color.

Avoid bounce, blur sweeps, or high saturation. Prefer `prefers-reduced-motion: reduce` when adding new sequences. Optional centralization: `lib/animation/animation.ts` + `components/motion/` per [files-convention.md](./files-convention.md).

---

## 7. Component styling (mist + shadcn)

1. **THEME-1 — Tokens only:** Chrome uses mist semantics — `bg-background`, `bg-card`, `text-muted-foreground`, `border-input`, `ring-ring/30`. Links/emphasis: `text-primary`. Errors/destructive money: `text-destructive` or Button `variant="destructive"` (tinted `destructive/10`, not solid red blocks).
2. **THEME-2 — Light/dark pairs:** Same token names in `:root` and `.dark`; mist flips primary (dark slate button in light → light gray button in dark). Never fork component colors per mode.
3. **THEME-3 — Reskin in CSS:** New look = edit OKLCH in `globals.css` + `@theme inline` aliases. Components keep shadcn class names.
4. **Primary actions:** Default Button — `bg-primary text-primary-foreground hover:bg-primary/80`. Secondary flows — `secondary`, `outline` (`border-border`, `hover:bg-muted`), low-priority — `ghost`. Destructive confirm — `destructive` variant only.
5. **Focus & a11y:** Primitives already use `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30`. Icon buttons need `aria-label` (`ThemeToggle`, mobile settings).
6. **Data density:** Table hover `hover:bg-muted/30`; section labels `text-sm font-medium text-muted-foreground`; amounts `tabular-nums font-semibold` via `SignedAmount` token map above.
7. **Horizontal scroll:** Mist-bordered scroller — outer `rounded-xl border border-border`, inner `overflow-x-auto`, preserve focus rings (no `overflow-hidden` on focusable rows).
