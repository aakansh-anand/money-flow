# File & Folder Conventions

> **Rules**
>
> - **FILE-1 — Naming:** Files in `kebab-case`; components & types in `PascalCase`; hooks in `useXxx`; helpers in `camelCase`.
> - **FILE-2 — Imports:** Always import via `@/*` path aliases, never relative `../../`.
> - **FILE-3 — `src/app` holds routes only:** General-purpose reusable components belong in `src/components/`.
> - **FILE-4 — Backend access lives in store API modules:** All client-side backend queries use RTK Query.
> - **FILE-5 — Named exports:** Components use named exports (`export const ComponentName`), reserving `export default` for Next.js App Router requirements (`page.tsx`, `layout.tsx`).

---

## Standard Folder Structure

```md
apps/web/
├── app/                      # Next.js App Router (routes only)
│   ├── layout.tsx            # Root layout shell & providers
│   ├── page.tsx              # Route page (Server Component — thin wrapper)
│   └── globals.css           # Global CSS styles & theme tokens
│
├── features/                 # Feature modules (primary home for product UI)
│   └── <feature>/
│       ├── components/       # Client screens, forms, feature UI
│       ├── hooks/            # Feature hooks (useXxx)
│       ├── services.ts       # RTK Query re-exports for this feature
│       └── index.ts          # Public feature API
│
├── components/
│   ├── ui/                   # Reusable UI primitives (Button, Card, Input, ...)
│   └── motion/               # Reusable animation islands
│
├── hooks/                    # Cross-feature hooks only (prefer feature/hooks/)
│
├── lib/                      # Framework-agnostic helpers & utilities
│   └── utils.ts              # Styling helpers (cn)
│
├── redux/                    # Redux Toolkit & RTK Query
│   ├── index.ts              # Store configuration
│   ├── hooks.ts              # Typed useAppSelector / useAppDispatch
│   ├── api/                  # RTK Query API endpoints
│   └── slices/               # Global client state slices
│
└── types/                    # Shared TypeScript interfaces & types (if not in @kosh/shared)
```

---

## Naming Conventions (FILE-1, FILE-5)

| Element              | Convention                    | Example                                             |
| -------------------- | ----------------------------- | --------------------------------------------------- |
| `.ts` / `.tsx` files | `kebab-case`                  | `theme-toggle.tsx`, `use-feature.ts`, `base-api.ts` |
| React component      | `PascalCase`                  | `export const FeatureCard = ...`                    |
| Custom Hook          | `kebab` file, `useXxx` export | `use-feature.ts` → `export function useFeature()`   |
| Utility Function     | `camelCase`                   | `cn()`, `formatDate()`                              |
| Type / Interface     | `PascalCase`                  | `interface User`, `type Status`                     |
| Redux Slice File     | `*-slice.ts`                  | `ui-slice.ts`                                       |
| RTK Query API File   | `*Api.ts` or `*-api.ts`       | `baseApi.ts`, `search-api.ts`                       |

Use **named exports** for components to enforce consistent import naming, preserving `default` exports for framework route files (`page.tsx`, `layout.tsx`).

---

## App Router Conventions — `src/app` (FILE-3)

`src/app` contains **routes only**. Use Next.js framework files as intended:

| File            | Purpose                                      |
| --------------- | -------------------------------------------- |
| `page.tsx`      | Route page (**Server Component** — import `*Screen` from `@/features/...`) |
| `layout.tsx`    | Shared shell & providers for a route segment |
| `loading.tsx`   | Suspense fallback UI for loading state       |
| `error.tsx`     | Error boundary UI (`"use client"`)           |
| `not-found.tsx` | 404 page UI                                  |

Feature UI belongs in `features/<feature>/` (components, hooks, `services.ts`, `index.ts`). Keep `app/` strictly for route files.

---

## Path Aliases (FILE-2)

Root path aliases are configured in `tsconfig.json`:

```json
"paths": {
  "@/*": ["./*"]
}
```

| Alias             | Resolves to         |
| ----------------- | ------------------- |
| `@/components`    | `components`        |
| `@/components/ui` | `components/ui`     |
| `@/features`      | `features`          |
| `@/lib`           | `lib`               |
| `@/hooks`         | `hooks`             |
| `@/redux`         | `redux`             |

Always import using `@/*` aliases — never relative paths (`../../`).

---

## Decision Table: Where Code Belongs

| Adding...                       | Location                                 |
| ------------------------------- | ---------------------------------------- |
| A reusable UI primitive         | `src/components/ui/`                     |
| A feature screen / form         | `features/<feature>/components/`         |
| Feature hook                    | `features/<feature>/hooks/` (`useXxx`)   |
| Feature RTK endpoints + hooks   | `features/<feature>/services.ts` (`injectEndpoints`) |
| Reusable animation wrapper      | `components/motion/`                     |
| Cross-feature hook              | `hooks/` (`useXxx`)                      |
| Helper function / utility       | `lib/`                                   |
| Client global state             | `redux/slices/`                          |
| RTK base API + store wiring     | `redux/` (`base-api.ts`, `register-endpoints.ts`) |
| Shared TypeScript types         | `@kosh/shared` or `types/`               |
