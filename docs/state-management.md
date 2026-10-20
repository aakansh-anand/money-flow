# State Management

> **Rules**
>
> - **SM-1 — Read-once page data** → Fetch in a **Server Component**.
> - **SM-2 — Client-side backend data** → Use **RTK Query**. Never call raw `fetch` inside a `useEffect`.
> - **SM-3 — Pure client global state** → Use **Redux Toolkit slices** (`createSlice`). Keep local UI state in `useState`.
> - **SM-4 — Centralized API configuration** → Use a unified API definition, extending endpoints per feature.
> - **SM-5 — Typed hooks** → Always use typed `useAppSelector` / `useAppDispatch` hooks.

---

## Tier 1 — Server Components (SM-1)

For static or read-once data required to render a route, fetch directly on the server within the Server Component (`page.tsx`) and pass down as props. No client state library is needed.

```tsx
// app/feature/page.tsx — Server Component
export default async function FeaturePage() {
  const data = await fetch("https://api.example.com/items").then((res) => res.json());
  return <FeatureList items={data} />;
}
```

---

## Tier 2 — Client Backend Access via RTK Query (SM-2, SM-4)

All interactive client data fetching and mutations should go through RTK Query API endpoints. RTK Query manages caching, request deduplication, loading states, and cache invalidation automatically.

### Base API Configuration

```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
    prepareHeaders: (headers) => {
      // Attach authentication tokens here if available
      return headers;
    },
  }),
  tagTypes: ["Item"],
  endpoints: () => ({}),
});
```

### Feature endpoints (`features/<feature>/services.ts`)

RTK Query endpoint definitions live with the feature, not under `redux/api/`. Each feature calls `baseApi.injectEndpoints` and exports the generated hooks.

```ts
import { baseApi } from "@/redux/api/base-api";

export const featureApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getItems: build.query<Item[], void>({
      query: () => "/items",
      providesTags: ["Item"],
    }),
    addItem: build.mutation<Item, Partial<Item>>({
      query: (body) => ({ url: "/items", method: "POST", body }),
      invalidatesTags: ["Item"],
    }),
  }),
});

export const { useGetItemsQuery, useAddItemMutation } = featureApi;
```

Register endpoints before the store runs queries: `redux/register-endpoints.ts` side-effect-imports every feature `services.ts`; `makeStore()` imports that module first.

---

## Tier 3 — Pure Client Global State (SM-3)

Use Redux Toolkit slices (`createSlice`) for global client state that is not persisted on the backend (e.g. active UI themes, navigation drawers, multi-step wizard state).

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  isDrawerOpen: boolean;
}

const initialState: UiState = {
  isDrawerOpen: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    setDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isDrawerOpen = action.payload;
    },
  },
});

export const { toggleDrawer, setDrawerOpen } = uiSlice.actions;
export default uiSlice.reducer;
```

> **Note:** Component-local UI state (e.g. an input field value or local expansion state) should remain in `useState` inside a custom hook, not in the global store.

---

## Store Wiring & Typed Hooks (SM-5)

Always import and use typed dispatch and selector hooks across the application:

```ts
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```
