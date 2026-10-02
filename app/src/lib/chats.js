/**
 * Bravo — chat persistence.
 * Stores conversations (messages + tool activity) in localStorage.
 * Short-term agent state itself is handled by the LangGraph checkpointer;
 * this module mirrors a display-friendly copy so the UI can rehydrate.
 */
import { CHATS_KEY } from "./constants";

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadChats() {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return [];
    const chats = JSON.parse(raw);
    return Array.isArray(chats) ? chats : [];
  } catch {
    return [];
  }
}

export function persistChats(chats) {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch (e) {
    // Storage full — drop oldest chats until it fits.
    try {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats.slice(0, Math.max(1, chats.length - 1))));
    } catch {
      /* give up silently */
    }
  }
}

export function makeChat(title = "New chat") {
  return {
    id: generateId(),
    title,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function chatTitleFrom(text) {
  const t = (text || "New chat").replace(/\s+/g, " ").trim().slice(0, 42);
  return t.length < text.length ? t + "…" : t;
}
