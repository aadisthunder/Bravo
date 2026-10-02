/**
 * Bravo — onboarding state and model helper utilities.
 */
import { PROVIDERS, ALL_MODELS } from "./constants.js";

export const ONBOARDING_KEY = "bravo.onboarding.completed";

export function isOnboardingCompleted() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function setOnboardingCompleted() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch (e) {
    console.warn("Failed to save onboarding state", e);
  }
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (e) {
    console.warn("Failed to reset onboarding state", e);
  }
}

export function getModelInfo(modelId) {
  const match = ALL_MODELS.find((m) => m.id === modelId);
  if (match) return match;
  // Fallback to first available model if not found
  return ALL_MODELS[0] || null;
}

export function getAvailableModelsGrouped() {
  return PROVIDERS;
}
