/**
 * Bravo — tool factory.
 * Small built-in tools + Tavily web search + a long-term memory tool.
 * Everything follows @langchain/core's `tool()` helper with zod schemas.
 * Toggles in Settings → Tools decide which tools the agent actually gets.
 */
import { TavilySearch } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import { z } from "zod/v3";

/** Deterministic eval — only digits/operators allowed, no identifiers. */
function safeEval(expr) {
  if (!/^[\d\s+\-*/().%]+$/.test(expr)) {
    throw new Error("Calculator accepts digits and + - * / ( ) . % only.");
  }
  const result = new Function(`"use strict";return (${expr})`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Expression did not evaluate to a finite number.");
  }
  return String(result);
}

export function buildTools(settings, store) {
  const tools = [];

  if (settings.toolToggles?.web_search && settings.tavilyApiKey) {
    tools.push(
      new TavilySearch({
        tavilyApiKey: settings.tavilyApiKey,
        maxResults: 5,
        name: "web_search",
        description:
          "Search the public web for current information, news, facts, prices, weather. " +
          "Input should be a focused search query. Returns titles, URLs and content snippets.",
      }),
    );
  }

  if (settings.toolToggles?.calculator) {
    tools.push(
      tool(
        async ({ expression }) => safeEval(expression),
        {
          name: "calculator",
          description: "Evaluate a arithmetic expression. Input: a math expression using + - * / ( ) . % and digits.",
          schema: z.object({ expression: z.string().describe("e.g. 17*23 or (124/8)+31") }),
        },
      ),
    );
  }

  if (settings.toolToggles?.current_time) {
    tools.push(
      tool(
        async () => new Date().toString(),
        {
          name: "current_time",
          description: "Get the user's current local date and time. Takes no arguments.",
          schema: z.object({}),
        },
      ),
    );
  }

  if (settings.toolToggles?.memory_save && settings.longTermMemory && store) {
    tools.push(
      tool(
        async ({ text }) => {
          const userId = "bravo-user";
          const key = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          await store.put(["memories", userId], key, { text, createdAt: Date.now() });
          return `Saved to long-term memory: "${text}"`;
        },
        {
          name: "memory_save",
          description:
            "Save a durable fact about the user or conversation to long-term memory. " +
            "Use when the user shares a preference, name, project, or asks you to remember something.",
          schema: z.object({ text: z.string().describe("The fact to remember, one sentence") }),
        },
      ),
    );
  }

  return tools;
}

export function listActiveToolNames(settings) {
  const names = [];
  if (settings.toolToggles?.web_search && settings.tavilyApiKey) names.push("web_search");
  if (settings.toolToggles?.calculator) names.push("calculator");
  if (settings.toolToggles?.current_time) names.push("current_time");
  if (settings.toolToggles?.memory_save && settings.longTermMemory) names.push("memory_save");
  return names;
}
