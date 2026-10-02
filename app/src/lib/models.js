/**
 * Bravo — model factory.
 * Builds a LangChain chat model from user settings. Keys come from the
 * settings store (user's own API keys) — never hardcoded, never bundled.
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { PROVIDERS } from "./constants";

export function getApiKey(settings, providerId) {
  const p = providerId || settings.provider;
  if (p === "gemini") return settings.geminiApiKey;
  if (p === "groq") return settings.groqApiKey;
  return "";
}

export function resolveProvider(settings) {
  const modelEntry = ALL_MODELSLookup(settings.model);
  const provider = modelEntry?.provider || settings.provider || "gemini";
  return { provider, model: settings.model, providerMeta: PROVIDERS[provider] };
}

function ALL_MODELSLookup(modelId) {
  for (const [pid, p] of Object.entries(PROVIDERS)) {
    const m = p.models.find((m) => m.id === modelId);
    if (m) return { ...m, provider: pid };
  }
  return null;
}

/**
 * Create the chat model. Throws Error with a friendly message when the
 * relevant API key is missing — the UI maps this to the Settings page.
 */
export function createChatModel(settings, { streaming = true } = {}) {
  const { provider } = resolveProvider(settings);
  const apiKey = getApiKey(settings, provider);
  const common = {
    temperature: settings.temperature ?? 0.7,
    maxTokens: settings.maxTokens ?? 2048,
    streaming,
  };

  if (provider === "gemini") {
    if (!apiKey) throw new Error("Missing Gemini API key — add it in Settings → API keys.");
    return new ChatGoogleGenerativeAI({
      ...common,
      model: settings.model,
      apiKey,
    });
  }

  if (provider === "groq") {
    if (!apiKey) throw new Error("Missing Groq API key — add it in Settings → API keys.");
    return new ChatGroq({
      ...common,
      model: settings.model,
      apiKey,
    });
  }

  throw new Error(`Unknown provider: ${provider}`);
}

/** Quick key validation used by Settings "Test key" buttons. */
export async function validateKey(providerId, apiKey) {
  try {
    if (providerId === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1`,
      );
      return { ok: res.ok, message: res.ok ? "Key works — Gemini endpoint reachable." : `Key rejected (HTTP ${res.status}).` };
    }
    if (providerId === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return { ok: res.ok, message: res.ok ? "Key works — Groq endpoint reachable." : `Key rejected (HTTP ${res.status}).` };
    }
    if (providerId === "tavily") {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ query: "test", max_results: 1 }),
      });
      return { ok: res.ok, message: res.ok ? "Key works — Tavily search reachable." : `Key rejected (HTTP ${res.status}).` };
    }
    if (providerId === "langsmith") {
      const res = await fetch("https://api.smith.langchain.com/api/v1/sessions/?limit=1", {
        headers: { "x-api-key": apiKey },
      });
      return { ok: res.ok, message: res.ok ? "Key works — LangSmith reachable." : `Key rejected (HTTP ${res.status}).` };
    }
    return { ok: false, message: "Unknown provider." };
  } catch (e) {
    return { ok: false, message: `Network error: ${e.message}` };
  }
}
