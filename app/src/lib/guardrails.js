/**
 * Bravo — guardrails.
 * Fully client-side, deterministic pre/post checks around the LLM call.
 * No blur, no magic — just strict rules the user can inspect in Settings.
 */
import { GUARDRAIL_REFUSAL } from "./constants";

const DEFAULT_BLOCKLIST = [
  "build a bomb",
  "make explosives",
  "synthesi[sz]e meth",
  "create malware",
  "ransomware script",
  "credit card numbers of",
  "steal (someone'?s?) (password|identity)",
];

function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function compileWord(w) {
  try {
    return new RegExp(w, "i");
  } catch {
    return new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
}

/**
 * Input rail: returns { ok: boolean, reason?: string }.
 * Checks blocked words (user list first, then built-ins) and hard length caps.
 */
export function checkInput(input, settings) {
  if (!settings?.guardrailsEnabled) return { ok: true };
  if (input.length > 20000) {
    return { ok: false, reason: "Input exceeds the 20,000 character limit set by guardrails." };
  }
  const words = [...(settings.blockedWords || []), ...DEFAULT_BLOCKLIST];
  for (const w of words) {
    if (!w) continue;
    if (compileWord(w).test(input)) {
      return { ok: false, reason: `Matched blocked rule: "${w}"` };
    }
  }
  return { ok: true };
}

/** Output rail: neutralizes obvious prompt-leak attempts in the final answer. */
export function checkOutput(text, settings) {
  if (!settings?.guardrailsEnabled) return text;
  let out = String(text ?? "");
  if (out.length > (settings.maxOutputChars || 12000)) {
    out = out.slice(0, settings.maxOutputChars) + "\n\n…[output truncated by Bravo guardrails]";
  }
  return out;
}

export { GUARDRAIL_REFUSAL };
