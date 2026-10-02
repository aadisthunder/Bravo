import test from "node:test";
import assert from "node:assert/strict";
import {
  isOnboardingCompleted,
  setOnboardingCompleted,
  resetOnboarding,
  getModelInfo,
  getAvailableModelsGrouped,
} from "../src/lib/onboarding.js";

// Mock localStorage for Node test environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

test("onboarding defaults to not completed for first-time visitors", () => {
  mockStorage.clear();
  assert.equal(isOnboardingCompleted(), false);
});

test("setOnboardingCompleted marks onboarding as completed in storage", () => {
  mockStorage.clear();
  setOnboardingCompleted();
  assert.equal(isOnboardingCompleted(), true);
  assert.equal(localStorage.getItem("bravo.onboarding.completed"), "true");
});

test("resetOnboarding clears onboarding status", () => {
  setOnboardingCompleted();
  assert.equal(isOnboardingCompleted(), true);
  resetOnboarding();
  assert.equal(isOnboardingCompleted(), false);
});

test("getModelInfo correctly identifies provider and details for Gemini models", () => {
  const info = getModelInfo("gemini-3.5-flash");
  assert.ok(info);
  assert.equal(info.id, "gemini-3.5-flash");
  assert.equal(info.provider, "gemini");
  assert.equal(info.label, "Gemini 3.5 Flash");
});

test("getModelInfo correctly identifies provider and details for Groq models", () => {
  const info = getModelInfo("llama-3.3-70b-versatile");
  assert.ok(info);
  assert.equal(info.id, "llama-3.3-70b-versatile");
  assert.equal(info.provider, "groq");
  assert.equal(info.label, "Llama 3.3 70B Versatile");
});

test("getAvailableModelsGrouped returns models grouped by provider", () => {
  const grouped = getAvailableModelsGrouped();
  assert.ok(grouped.gemini);
  assert.ok(grouped.groq);
  assert.ok(grouped.gemini.models.length > 0);
  assert.ok(grouped.groq.models.length > 0);
});
