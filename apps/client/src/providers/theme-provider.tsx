"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { writeThemeCookie, type ThemeSetting } from "@/lib/theme-cookie";

export type { ThemeSetting };
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

type ThemeContextValue = {
  theme: ThemeSetting;
  setTheme: (theme: ThemeSetting) => void;
  resolvedTheme: ResolvedTheme | undefined;
  systemTheme: ResolvedTheme | undefined;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: ThemeSetting): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: ThemeSetting) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  writeThemeCookie(theme);
}

function readStoredTheme(fallback: ThemeSetting): ThemeSetting {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    // ignore
  }
  return fallback;
}

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeSetting;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const initialDefaultThemeRef = useRef(defaultTheme);

  const [theme, setThemeState] = useState<ThemeSetting>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | undefined>(undefined);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme | undefined>(undefined);
  const didHydrateTheme = useRef(false);

  useLayoutEffect(() => {
    if (didHydrateTheme.current) {
      return;
    }
    didHydrateTheme.current = true;

    const stored = readStoredTheme(initialDefaultThemeRef.current);
    const resolved = resolveTheme(stored);
    const system = getSystemTheme();

    applyTheme(stored);

    setThemeState((prev) => (prev === stored ? prev : stored));
    setResolvedTheme((prev) => (prev === resolved ? prev : resolved));
    setSystemTheme((prev) => (prev === system ? prev : system));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const nextSystem = getSystemTheme();
      setSystemTheme(nextSystem);
      if (theme === "system") {
        applyTheme("system");
        setResolvedTheme(nextSystem);
      }
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback(
    (next: ThemeSetting) => {
      const apply = () => {
        setThemeState(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // ignore
        }
        applyTheme(next);
        setResolvedTheme(resolveTheme(next));
      };

      if (disableTransitionOnChange) {
        apply();
        return;
      }

      apply();
    },
    [disableTransitionOnChange],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
