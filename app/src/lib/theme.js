/**
 * Bravo — theme manager.
 * Applies light / dark / system theme via a `data-theme` attribute on <html>.
 * No blur or gradient effects anywhere; flat, clean surfaces only.
 */
import { loadSettings, saveSettings, updateSettings } from "./settings";

const listeners = new Set();

export function getEffectiveTheme() {
  const t = loadSettings().theme;
  if (t === "system") {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return t;
}

function apply() {
  const theme = getEffectiveTheme();
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#1a1a19" : "#fafaf9");
  }
  listeners.forEach((fn) => fn(theme));
}

export function setTheme(theme) {
  updateSettings({ theme });
  apply();
}

export function initTheme() {
  apply();
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", apply);
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export { saveSettings };
