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
src/
├── app/                      # Next.js App Router (routes only)
│   ├── layout.tsx            # Root layout shell & providers
│   ├── page.tsx              # Route page (Server Component by default)
│   └── globals.css           # Global CSS styles & theme tokens
│
├── components/
│   ├── ui/                   # Reusable UI primitives (Button, Card, Input, ...)
│   ├── motion/               # Reusable animation islands
│   └── <feature>/            # Feature-grouped components
│
├── hooks/                    # Custom React hooks (useXxx)
│
├── lib/                      # Framework-agnostic helpers & utilities
│   └── utils.ts              # Styling helpers (cn)
│
├── store/                    # Redux Toolkit & RTK Query
│   ├── index.ts              # Store configuration
│   ├── hooks.ts              # Typed useAppSelector / useAppDispatch
│   ├── api/                  # RTK Query API endpoints
│   └── slices/               # Global client state slices
│
└── types/                    # Shared TypeScript interfaces & types
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
| `page.tsx`      | Route page (**Server Component**)            |
| `layout.tsx`    | Shared shell & providers for a route segment |
| `loading.tsx`   | Suspense fallback UI for loading state       |
| `error.tsx`     | Error boundary UI (`"use client"`)           |
| `not-found.tsx` | 404 page UI                                  |

Feature-specific components belong in `src/components/<feature>/`, keeping `src/app` strictly for route files.

---

## Path Aliases (FILE-2)

Root path aliases are configured in `tsconfig.json`:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

| Alias             | Resolves to         |
| ----------------- | ------------------- |
| `@/components`    | `src/components`    |
| `@/components/ui` | `src/components/ui` |
| `@/lib`           | `src/lib`           |
| `@/hooks`         | `src/hooks`         |
| `@/store`         | `src/store`         |

Always import using `@/*` aliases — never relative paths (`../../`).

---

## Decision Table: Where Code Belongs

| Adding...                       | Location                                 |
| ------------------------------- | ---------------------------------------- |
| A reusable UI primitive         | `src/components/ui/`                     |
| A feature-specific component    | `src/components/<feature>/`              |
| Reusable animation wrapper      | `src/components/motion/`                 |
| Stateful logic / hook           | `src/hooks/` (`useXxx`)                  |
| Helper function / utility       | `src/lib/`                               |
| Client global state             | `src/store/slices/`                      |
| Backend API queries / mutations | `src/store/api/` or `src/redux-toolkit/` |
| Shared TypeScript types         | `src/types/`                             |
