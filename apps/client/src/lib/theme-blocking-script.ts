/** Runs before paint to avoid theme flash. Keep in sync with `ThemeProvider`. */
export const themeBlockingScript = `
(function () {
  try {
  var storageKey = "theme";
  var theme = localStorage.getItem(storageKey) || "system";
  var resolved = theme;
  if (theme === "system") {
    resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  var root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
} catch (e) {}
})();
`.trim();
