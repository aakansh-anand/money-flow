export type ThemeSetting = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseThemeCookie(value: string | undefined): ThemeSetting {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

/** Server-safe class for explicit light/dark; system resolves on the client. */
export function themeClassFromSetting(theme: ThemeSetting): "light" | "dark" | undefined {
  if (theme === "light" || theme === "dark") {
    return theme;
  }
  return undefined;
}

export function writeThemeCookie(theme: ThemeSetting): void {
  try {
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // ignore
  }
}
