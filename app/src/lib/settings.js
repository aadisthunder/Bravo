/**
 * Bravo — settings store.
 * Loads/saves the settings object from localStorage with schema migration.
 */
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants.js";

let cached = null;

function deepMerge(base, patch) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base?.[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

export function loadSettings() {
  if (cached) return cached;
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    stored = {};
  }
  cached = deepMerge(DEFAULT_SETTINGS, stored);
  return cached;
}

export function saveSettings(next) {
  cached = next;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("Bravo: failed to persist settings", e);
  }
}

export function updateSettings(patch) {
  const next = deepMerge(loadSettings(), patch);
  saveSettings(next);
  return next;
}

export function resetSettings() {
  cached = null;
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    /* ignore */
  }
  return loadSettings();
}
