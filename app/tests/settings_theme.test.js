import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "../src/lib/constants.js";
import { loadSettings, saveSettings, updateSettings, resetSettings } from "../src/lib/settings.js";

// Mock localStorage for Node test environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

test("DEFAULT_SETTINGS has system theme by default", () => {
  assert.equal(DEFAULT_SETTINGS.theme, "system");
});

test("loadSettings returns default settings when storage is empty", () => {
  resetSettings();
  const settings = loadSettings();
  assert.equal(settings.theme, "system");
  assert.equal(settings.provider, "gemini");
  assert.equal(settings.model, "gemini-3.5-flash");
});

test("updateSettings updates model and provider cleanly", () => {
  resetSettings();
  const updated = updateSettings({ provider: "groq", model: "llama-3.3-70b-versatile" });
  assert.equal(updated.provider, "groq");
  assert.equal(updated.model, "llama-3.3-70b-versatile");
  const reloaded = loadSettings();
  assert.equal(reloaded.provider, "groq");
  assert.equal(reloaded.model, "llama-3.3-70b-versatile");
});

test("updateSettings updates theme setting cleanly", () => {
  resetSettings();
  const updated = updateSettings({ theme: "dark" });
  assert.equal(updated.theme, "dark");
  const reloaded = loadSettings();
  assert.equal(reloaded.theme, "dark");
});
