/**
 * Bravo — agent runtime.
 * A LangGraph ReAct agent (createReactAgent) wired to:
 *  - user-selected model (Gemini / Groq) via settings
 *  - tools: web_search (Tavily), calculator, current_time, memory_save
 *  - short-term memory: LocalStorageSaver checkpointer (survives reloads)
 *  - long-term memory: LocalStorageStore + memory recall injected into the prompt
 *  - guardrails: input/output rails from lib/guardrails.js
 *  - LangSmith: per-session LangChainTracer when enabled in settings
 *
 * runAgent is an async generator: the UI consumes events live for streaming.
 */
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { Client } from "langsmith";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";

import { createChatModel, resolveProvider } from "./models";
import { buildTools } from "./tools";
import { LocalStorageSaver, LocalStorageStore } from "./persistence";
import { checkInput, checkOutput, GUARDRAIL_REFUSAL } from "./guardrails";
import { APP_NAME } from "./constants";

let _checkpointer = null;
let _store = null;

export function getCheckpointer() {
  if (!_checkpointer) _checkpointer = new LocalStorageSaver();
  return _checkpointer;
}

export function getStore() {
  if (!_store) _store = new LocalStorageStore();
  return _store;
}

/** Build the system prompt: agent instruction + long-term memory recall + context. */
export function buildSystemPrompt(settings, memories) {
  const parts = [];
  parts.push(settings.agentInstruction?.trim() || `You are ${APP_NAME}, a helpful AI assistant.`);

  parts.push(`Current date/time: ${new Date().toString()}`);

  if (settings.longTermMemory && memories?.length) {
    const memLines = memories
      .slice(0, 12)
      .map((m) => `- ${m.value?.text ?? m.text ?? JSON.stringify(m.value)}`)
      .join("\n");
    parts.push(`Known facts about the user (long-term memory — use naturally, don't recite):\n${memLines}`);
  }

  if (settings.shortTermMemory === false) {
    parts.push(
      "Note: you do not retain memory of previous turns in this conversation. If the user refers to earlier messages, ask them to repeat the context.",
    );
  }
  return parts.join("\n\n");
}

/** Fetch memories relevant to the latest user input (keyword + recency ranking). */
async function recallMemories(settings, input) {
  if (!settings.longTermMemory) return [];
  const store = getStore();
  const all = store.dumpAll(["memories"]);
  if (!all.length) return [];
  const terms = input.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const scored = all
    .map((m) => {
      const text = String(m.value?.text ?? "").toLowerCase();
      let score = m.value?.pinned ? 100 : 0;
      for (const t of terms) if (text.includes(t)) score += 10;
      score += Math.max(0, 5 - (Date.now() - (m.updatedAt || 0)) / 86_400_000);
      return { m, score };
    })
    .filter(({ score }) => score > 3)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map(({ m }) => m);
}

/** Build a per-run LangSmith tracer when tracing is enabled + key present. */
function buildTracer(settings) {
  if (!settings.langsmithEnabled || !settings.langsmithApiKey) return null;
  try {
    const client = new Client({
      apiKey: settings.langsmithApiKey,
      apiUrl: settings.langsmithEndpoint || "https://api.smith.langchain.com",
    });
    return new LangChainTracer({
      projectName: settings.langsmithProject || "Bravo",
      client,
      metadata: { app: APP_NAME, provider: resolveProvider(settings).provider, model: settings.model },
    });
  } catch (e) {
    console.warn("Bravo: LangSmith tracer init failed", e);
    return null;
  }
}

/**
 * Run one agent turn. Yields events:
 *   { type: "token", value }            — streamed text chunk from the model
 *   { type: "tool-start", name, args }  — a tool call begins
 *   { type: "tool-end", name, result }  — a tool finished
 *   { type: "done", message }           — final message ({ content })
 *   { type: "error", message, kind }    — failure ("guardrail" | "api" | "config")
 */
export async function* runAgent({ chatId, messages, settings, signal }) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const input = lastUser?.content ?? "";

  // ---- Guardrail: input rail ----
  const gate = checkInput(input, settings);
  if (!gate.ok) {
    yield { type: "error", kind: "guardrail", message: GUARDRAIL_REFUSAL, detail: gate.reason };
    return;
  }

  // ---- Model + tools ----
  let llm;
  try {
    llm = createChatModel(settings);
  } catch (e) {
    yield { type: "error", kind: "config", message: e.message };
    return;
  }

  const store = getStore();
  const tools = buildTools(settings, store);
  const memories = await recallMemories(settings, input);
  const systemPrompt = buildSystemPrompt(settings, memories);
  const tracer = buildTracer(settings);

  const agent = createReactAgent({
    llm,
    tools,
    prompt: systemPrompt,
    checkpointer: settings.shortTermMemory === false ? undefined : getCheckpointer(),
    store,
  });

  const config = {
    configurable: { thread_id: chatId },
    callbacks: tracer ? [tracer] : undefined,
    runName: `${APP_NAME} · ${settings.model}`,
  };
  if (signal) config.signal = signal;

  let fullText = "";
  const seenTools = new Set();

  try {
    const stream = await agent.stream({ messages: [new HumanMessage(input)] }, { ...config, streamMode: "messages" });

    for await (const [chunk, meta] of stream) {
      if (signal?.aborted) break;
      const node = meta?.langgraph_node;

      // Surface tool calls as they stream in
      if (Array.isArray(chunk?.tool_call_chunks)) {
        for (const tc of chunk.tool_call_chunks) {
          const key = `${tc.name}:${tc.index ?? 0}`;
          if (tc.name && !seenTools.has(key)) {
            seenTools.add(key);
            let args = {};
            try {
              args = tc.args ? JSON.parse(tc.args) : {};
            } catch {
              args = {};
            }
            yield { type: "tool-start", name: tc.name, args };
          }
        }
      }

      // Model tokens
      if (node === "agent" && chunk.content) {
        const text = typeof chunk.content === "string" ? chunk.content : extractText(chunk.content);
        if (text) {
          fullText += text;
          yield { type: "token", value: text };
        }
      }

      // Tool results (ToolMessage chunks from the tools node)
      if (node === "tools" && chunk.content) {
        const text = typeof chunk.content === "string" ? chunk.content : extractText(chunk.content);
        if (text) {
          yield { type: "tool-end", name: chunk.name || "tool", result: text };
        }
      }
    }

    yield { type: "done", message: { content: checkOutput(fullText, settings) } };
  } catch (e) {
    if (e?.name === "AbortError" || signal?.aborted) {
      yield { type: "done", message: { content: checkOutput(fullText, settings) || "_Stopped._" } };
      return;
    }
    yield { type: "error", kind: "api", message: friendlyError(e, settings) };
  }
}

function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => (typeof c === "string" ? c : c?.text ?? "")).join("");
  }
  return "";
}

function friendlyError(e, settings) {
  const raw = e?.message || String(e);
  if (/API key|API_KEY|invalid api key|401|403/i.test(raw)) {
    return `Authentication failed (${resolveProvider(settings).provider}). Check the API key in Settings → API keys.`;
  }
  if (/429|rate limit|quota/i.test(raw)) return "Rate limit or quota exceeded. Wait a moment and try again.";
  if (/not found|404/i.test(raw)) {
    return `Model "${settings.model}" not found for this key. Pick a different model in Settings → Model.`;
  }
  if (/fetch|network/i.test(raw)) return "Network error reaching the model provider. Check your connection.";
  return raw;
}
