/**
 * Bravo end-to-end smoke test (run in Node, no browser needed).
 * Usage: node scripts/e2e-test.mjs
 * Requires GEMINI_API_KEY and TAVILY_API_KEY env vars (or set them below).
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { InMemoryStore } from "@langchain/langgraph-checkpoint";
import { TavilySearch } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { HumanMessage } from "@langchain/core/messages";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const calculator = tool(
  async ({ expression }) => {
    const m = String(expression).match(/^[\d\s+\-*/().%]+$/);
    if (!m) throw new Error("Invalid expression");
    return String(new Function(`"use strict";return (${expression})`)());
  },
  {
    name: "calculator",
    description: "Calculate a math expression",
    schema: z.object({ expression: z.string().describe("The math expression") }),
  },
);

const clock = tool(
  async () => new Date().toString(),
  { name: "current_time", description: "Get the current date and time", schema: z.object({}) },
);

const tavily = new TavilySearch({ tavilyApiKey: TAVILY_API_KEY, maxResults: 3 });

const agent = createReactAgent({
  llm: new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash", apiKey: GEMINI_API_KEY, temperature: 0.7 }),
  tools: [tavily, calculator, clock],
  prompt: `You are Bravo, a helpful AI assistant.`,
  checkpointer: new MemorySaver(),
  store: new InMemoryStore(),
});

const config = { configurable: { thread_id: "e2e-test-1" } };

let failures = 0;
const assert = (cond, label) => {
  console.log(`${cond ? "PASS" : "FAIL"} — ${label}`);
  if (!cond) failures++;
};

console.log("=== TEST 1: Streaming tokens ===");
let streamed = "";
const stream = await agent.stream(
  { messages: [new HumanMessage("What is 17*23? Use the calculator tool. Reply in one short sentence.")] },
  { ...config, streamMode: "messages" },
);
for await (const [chunk, meta] of stream) {
  if (chunk.content && meta?.langgraph_node === "agent") {
    streamed += typeof chunk.content === "string" ? chunk.content : JSON.stringify(chunk.content);
  }
}
console.log("streamed:", streamed.slice(0, 120));
assert(streamed.length > 0, "streamed tokens received from agent node");

console.log("=== TEST 2: Short-term memory (same thread recall) ===");
const res2 = await agent.invoke(
  { messages: [new HumanMessage("What number did I ask you to calculate before? No tools needed.")] },
  config,
);
const reply2 = String(res2.messages[res2.messages.length - 1].content);
console.log("reply:", reply2.slice(0, 140));
assert(/391|17.*23|23.*17/.test(reply2), "agent recalls prior turn within thread");

console.log("=== TEST 3: Long-term store put/get/search ===");
const store = new InMemoryStore();
await store.put(["memories", "e2e-user"], "test-key", { text: "User's favorite color is teal" });
const got = await store.get(["memories", "e2e-user"], "test-key");
console.log("store.get:", JSON.stringify(got?.value));
assert(got?.value?.text === "User's favorite color is teal", "InMemoryStore roundtrip");
const found = await store.search(["memories", "e2e-user"], { query: "favorite color" });
console.log("store.search hits:", found.length);
assert(found.length >= 1, "store.search returns semantic hits");

console.log("=== TEST 4: Tavily tool direct invocation ===");
const tr = await tavily.invoke({ query: "LangGraph JS latest version" });
console.log("tavily result keys:", Object.keys(tr), "| results:", tr.results?.length);
assert(Array.isArray(tr.results) && tr.results.length > 0, "Tavily search returns results");

console.log(failures === 0 ? "\nALL E2E TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
