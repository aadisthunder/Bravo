/**
 * Bravo — central constants.
 * Providers, model catalog, default settings, guardrail lists.
 */

export const APP_NAME = "Bravo";
export const APP_TAGLINE = "A LangChain-powered AI assistant";

export const PROVIDERS = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    docsUrl: "https://aistudio.google.com/apikey",
    keyHint: "Paste your Gemini API key. It is stored only in this browser.",
    models: [
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", note: "Latest · fast & capable" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", note: "Latest · fastest" },
      { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", note: "Newest generation" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", note: "Stable workhorse" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", note: "Deep reasoning" },
      { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (Preview)", note: "Experimental" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Preview)", note: "Experimental" },
    ],
  },
  groq: {
    id: "groq",
    label: "Groq",
    docsUrl: "https://console.groq.com/keys",
    keyHint: "Paste your Groq API key (gsk_…). Ultra-fast open models.",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", note: "Flagship open model" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", note: "Lowest latency" },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", note: "OpenAI open-weight" },
      { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", note: "Lightweight open-weight" },
    ],
  },
};

export const ALL_MODELS = Object.entries(PROVIDERS).flatMap(([pid, p]) =>
  p.models.map((m) => ({ ...m, provider: pid, providerLabel: p.label })),
);

export const DEFAULT_SETTINGS = {
  // --- model ---
  provider: "gemini",
  model: "gemini-3.5-flash",
  temperature: 0.7,
  maxTokens: 2048,
  // --- agent ---
  agentInstruction:
    "You are Bravo, a sharp, friendly AI assistant. Answer clearly and concisely. " +
    "Use markdown when it helps readability. When a question involves recent events, " +
    "facts you are unsure about, or anything time-sensitive, use the web_search tool " +
    "before answering — then cite sources inline as [n].",
  historyDepth: 20,
  // --- api keys (user provided, stored locally) ---
  geminiApiKey: "",
  groqApiKey: "",
  tavilyApiKey: "",
  // --- memory ---
  shortTermMemory: true,
  longTermMemory: true,
  autoMemories: true,
  memories: [], // [{ id, text, createdAt, pinned }]
  // --- guardrails ---
  guardrailsEnabled: true,
  blockedWords: [],
  maxToolCalls: 6,
  maxOutputChars: 12000,
  // --- tools ---
  toolToggles: { web_search: true, calculator: true, current_time: true, memory_save: true },
  // --- langsmith ---
  langsmithEnabled: false,
  langsmithApiKey: "",
  langsmithProject: "Bravo",
  langsmithEndpoint: "https://api.smith.langchain.com",
  // --- ui ---
  theme: "system", // "light" | "dark" | "system"
  sendOnEnter: true,
};

export const SETTINGS_KEY = "bravo.settings.v1";
export const CHATS_KEY = "bravo.chats.v1";
export const THEME_KEY = "bravo.theme";

/** Words always blocked by the built-in guardrail (seed list; user can add more). */
export const SEED_BLOCKED_WORDS = [];

/** Guardrail refusal text returned when an input trips the rail. */
export const GUARDRAIL_REFUSAL =
  "I can't help with that request — it was flagged by Bravo's input guardrails. " +
  "Try rephrasing, or adjust the guardrail rules in Settings → Guardrails.";

export const SUGGESTIONS = [
  {
    icon: "Search",
    title: "Search the live web",
    desc: "Ask about news, prices, weather — Bravo uses Tavily",
    prompt: "What are the top AI headlines this week? Cite your sources.",
  },
  {
    icon: "Calculator",
    title: "Do the math",
    desc: "A calculator tool is one tool-call away",
    prompt: "If a jacket costs $120 after a 25% discount, what was the original price?",
  },
  {
    icon: "Brain",
    title: "Remember something",
    desc: "Long-term memory persists across chats",
    prompt: "Remember that my name is Aaditya and I prefer concise answers.",
  },
  {
    icon: "Lightbulb",
    title: "Brainstorm ideas",
    desc: "Structured, thoughtful responses",
    prompt: "Give me 5 creative weekend project ideas for a web developer.",
  },
];

export const ABOUT_TEXT =
  `${APP_NAME} is a fully client-side AI agent built with React + Vite on top of the ` +
  `LangChain ecosystem: @langchain/langgraph powers the ReAct agent loop, @langchain/google-genai ` +
  `and @langchain/groq provide models, @langchain/tavily provides web search, and LangSmith ` +
  `captures full traces. Your API keys and chats never leave your browser.`;
