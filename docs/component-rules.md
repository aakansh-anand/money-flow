# Component Rules

> **The Four Rules**
>
> - **CR-1 — Logic lives in hooks; TSX is dumb** — No business/stateful logic inline in components.
> - **CR-2 — Minimize `useState` / `useEffect`** — Derive values during render; let the compiler/framework handle memoization.
> - **CR-3 — Every page is a Server Component** — Never place `"use client"` at the top of `app/**/page.tsx`.
> - **CR-4 — Client components are maximally isolated** — Push `"use client"` down to the smallest possible leaf components.

These work together: server pages (CR-3) compose tiny client islands (CR-4) whose behavior comes from custom hooks (CR-1) that minimize local state (CR-2).

---

## CR-1 — Logic in Hooks, UI is Dumb

A component should read like a template: it renders props or derived values and wires user events. Anything stateful, timed, async, or computed belongs in a `useXxx` hook in `src/hooks/` or co-located with the feature.

### Example Pattern

**Logic in custom hook (`src/hooks/use-feature-timer.ts`):**

```ts
import { useEffect, useState } from "react";

export function useFeatureTimer(): string {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
```

**Dumb Component (`src/components/feature-timer.tsx`):**

```tsx
"use client";

import { useFeatureTimer } from "@/hooks/use-feature-timer";

export function FeatureTimer() {
  const time = useFeatureTimer();
  return <span>Live: {time || "Loading..."}</span>;
}
```

### Form Validation (Zod + React Hook Form)

All interactive forms should rely on `react-hook-form` coupled with `Zod` schemas for validation:

- Do **not** use raw `useState` to track individual input values.
- Do **not** use uncontrolled native HTML form validation.
- Schema definitions and validation logic belong outside component templates.

---

## CR-2 — Minimal `useState` / `useEffect`

Maintain minimal local state to ensure fast rendering and prevent hydration mismatches:

- **Derive, don't store:** If a value can be calculated from props or existing state during render, compute it directly.
- **No manual memoization:** Avoid unnecessary manual `useMemo` / `useCallback` / `React.memo` unless required for performance bottlenecks.
- **`useEffect` is for side-effects:** Syncing with external APIs, DOM listeners, or timers — not for data fetching (use RTK Query or Server Components).

```tsx
// ❌ Redundant stored state + effect
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(`${firstName} ${lastName}`), [firstName, lastName]);

// ✅ Derived directly during render
const fullName = `${firstName} ${lastName}`;
```

---

## CR-3 — Every Page is a Server Component

`app/**/page.tsx` routes must **not** start with `"use client"`. Server components ship zero client JavaScript, render on the server, and can fetch data directly.

```tsx
// app/page.tsx — Server Component (no "use client")
import { FeatureIsland } from "@/components/feature-island";

export default function Page() {
  return (
    <main>
      <h1>Page Title</h1>
      <FeatureIsland /> {/* Client island for interactivity */}
    </main>
  );
}
```

---

## CR-4 — Client Components, Maximally Isolated

When interactivity (hooks, event handlers, animations, browser APIs) is needed, wrap **only** that specific element in a `"use client"` component as deep in the DOM tree as possible.

### Isolation Patterns

- **Pass server markup as `children`** to thin client wrappers instead of making entire subtrees client-rendered.
- **Pass data down via props** from Server Components.
- **Single responsibility** — keep client islands focused on a single concern (e.g. a toggle, modal, or input control).

---

## Checklist Before Committing a Component

- [ ] No business or stateful logic inline in TSX templates — moved to a hook.
- [ ] Minimal `useState` / `useEffect`; derived values calculated during render.
- [ ] `page.tsx` routes have **no** `"use client"` directive.
- [ ] `"use client"` is isolated to leaf elements.
- [ ] Uses semantic design tokens and standard API query hooks.
