# Engineering Conventions & Documentation

Welcome to the engineering documentation guide. This directory outlines core architecture rules, component design guidelines, file conventions, and state management patterns.

---

## Documentation Quick Reference

| Task                                         | Read                                         |
| -------------------------------------------- | -------------------------------------------- |
| Building or modifying a **page / component** | [component-rules.md](./component-rules.md)   |
| File structure, naming, and path aliases     | [files-convention.md](./files-convention.md) |
| Data fetching, client state, & RTK Query     | [state-management.md](./state-management.md) |
| Styling, themes, & design tokens             | [theme.md](./theme.md)                       |

---

## Core Rule Index

Every core rule has a stable ID to cite in code reviews and commits:

### Components — [component-rules.md](./component-rules.md)

- **CR-1** — Logic lives in custom hooks (`src/hooks/`); TSX templates are dumb.
- **CR-2** — Minimize `useState`/`useEffect`; compute derived state during render.
- **CR-3** — Every `page.tsx` route is a Server Component (no top-level `"use client"`).
- **CR-4** — Client components are maximally isolated to the smallest leaf elements.

### Files & Folders — [files-convention.md](./files-convention.md)

- **FILE-1** — Files use `kebab-case`; components use `PascalCase`; hooks use `useXxx`.
- **FILE-2** — Import using `@/*` path aliases, never relative `../../`.
- **FILE-3** — `src/app` holds route segments only; reusable UI lives in `src/components/`.
- **FILE-4** — Client API fetching lives in dedicated RTK Query API modules.
- **FILE-5** — Use named exports (`export const ComponentName`), reserving `export default` for route files.

### State Management — [state-management.md](./state-management.md)

- **SM-1** — Read-once static page data is fetched in Server Components.
- **SM-2** — Client API fetching uses RTK Query hooks; never raw `fetch` in `useEffect`.
- **SM-3** — Global client state uses Redux Toolkit slices (`createSlice`); local UI state stays in `useState`.
- **SM-4** — Centralized API configuration extended via feature endpoints.
- **SM-5** — Always use typed `useAppSelector` and `useAppDispatch` hooks.

### Theme & Styling — [theme.md](./theme.md)

- **THEME-1** — Style using semantic design tokens; avoid hardcoded hex colors.
- **THEME-2** — Ensure theme tokens have both Light (`:root`) and Dark (`.dark`) definitions.
- **THEME-3** — Reskin applications by updating CSS variables, not individual components.

---

## Guidelines for AI Agents & Engineers

1. **Rule IDs as Contracts:** Treat stable rule IDs (**CR-1**, **FILE-2**, **SM-2**, etc.) as non-negotiable guidelines.
2. **Code Code Standards:** Keep component TSX files focused on layout and template structure while extracting state and DOM manipulation into hooks.
3. **TypeScript Validation:** Verify all code changes with `npx tsc --noEmit` before committing.
