/**
 * Bravo — checkpointer + store backed by localStorage.
 *
 * Short-term memory: mirrors LangGraph's MemorySaver but persists every
 * checkpoint (full graph state) into localStorage, so conversations survive
 * page reloads. Extends BaseCheckpointSaver and reuses its serde + versioning.
 *
 * Long-term memory: extends BaseStore with the same namespace/key/value model
 * as InMemoryStore, persisted to localStorage. PowerBravo's auto-memory tool
 * writes here; every turn reads relevant memories back into the prompt.
 */
import { BaseCheckpointSaver } from "@langchain/langgraph-checkpoint";
import { BaseStore } from "@langchain/langgraph-checkpoint";
import { TASKS } from "@langchain/langgraph-checkpoint";

const CKPT_KEY = "bravo.checkpoints.v1";
const STORE_KEY = "bravo.longterm.v1";

function safeKey(s, allowEmpty = false) {
  if (typeof s !== "string") throw new Error("Invalid storage key");
  if (!allowEmpty && s === "") throw new Error("Empty storage key");
  if (s === "__proto__" || s === "constructor" || s === "prototype") throw new Error("Reserved key");
  return s;
}

function jstr(v) {
  return typeof v === "string" ? v : JSON.stringify(v);
}

/** ---------- Short-term memory: persistent checkpointer ---------- */

export class LocalStorageSaver extends BaseCheckpointSaver {
  constructor() {
    super();
    this.cache = LocalStorageSaver._load();
    this._saveTimer = null;
  }

  static _load() {
    try {
      const raw = localStorage.getItem(CKPT_KEY);
      if (!raw) return { storage: {}, writes: {} };
      const parsed = JSON.parse(raw);
      return {
        storage: parsed.storage && typeof parsed.storage === "object" ? parsed.storage : {},
        writes: parsed.writes && typeof parsed.writes === "object" ? parsed.writes : {},
      };
    } catch {
      return { storage: {}, writes: {} };
    }
  }

  _schedulePersist() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      try {
        localStorage.setItem(CKPT_KEY, JSON.stringify(this.cache));
      } catch (e) {
        console.warn("Bravo checkpointer: persist failed", e);
      }
    }, 400);
  }

  _generateKey(threadId, ns, ckptId) {
    return JSON.stringify([threadId, ns, ckptId]);
  }

  async getTuple(config) {
    const threadId = safeKey(config.configurable?.thread_id);
    const ns = safeKey(config.configurable?.checkpoint_ns ?? "", true);
    let checkpointId = config.configurable?.checkpoint_id;

    if (checkpointId) {
      const saved = this.cache.storage[threadId]?.[ns]?.[checkpointId];
      if (!saved) return undefined;
      const [serializedCkpt, serializedMeta, parentId] = saved;
      const checkpoint = await this.serde.loadsTyped("json", serializedCkpt);
      const metadata = await this.serde.loadsTyped("json", serializedMeta);
      const writesKey = this._generateKey(threadId, ns, checkpointId);
      const pendingWrites = await Promise.all(
        Object.values(this.cache.writes[writesKey] || {}).map(async ([taskId, channel, value]) => [
          taskId,
          channel,
          await this.serde.loadsTyped("json", value),
        ]),
      );
      const tuple = { config, checkpoint, metadata, pendingWrites };
      if (parentId) {
        tuple.parentConfig = { configurable: { thread_id: threadId, checkpoint_ns: ns, checkpoint_id: parentId } };
      }
      return tuple;
    }

    const checkpoints = this.cache.storage[threadId]?.[ns];
    if (!checkpoints) return undefined;
    const latestId = Object.keys(checkpoints).sort((a, b) => b.localeCompare(a))[0];
    const [serializedCkpt, serializedMeta, parentId] = checkpoints[latestId];
    const checkpoint = await this.serde.loadsTyped("json", serializedCkpt);
    const metadata = await this.serde.loadsTyped("json", serializedMeta);
    const writesKey = this._generateKey(threadId, ns, latestId);
    const pendingWrites = await Promise.all(
      Object.values(this.cache.writes[writesKey] || {}).map(async ([taskId, channel, value]) => [
        taskId,
        channel,
        await this.serde.loadsTyped("json", value),
      ]),
    );
    const tuple = {
      config: { configurable: { thread_id: threadId, checkpoint_id: latestId, checkpoint_ns: ns } },
      checkpoint,
      metadata,
      pendingWrites,
    };
    if (parentId) {
      tuple.parentConfig = { configurable: { thread_id: threadId, checkpoint_ns: ns, checkpoint_id: parentId } };
    }
    return tuple;
  }

  async *list(config, options) {
    const { before, limit, filter } = options ?? {};
    const threadId = config.configurable?.thread_id;
    const ns = config.configurable?.checkpoint_ns ?? "";
    const threadIds = threadId ? [threadId] : Object.keys(this.cache.storage);
    let count = 0;
    for (const tid of threadIds) {
      const nsMap = this.cache.storage[tid]?.[ns];
      if (!nsMap) continue;
      const entries = Object.entries(nsMap).sort((a, b) => b[0].localeCompare(a[0]));
      for (const [ckptId, saved] of entries) {
        if (before?.configurable?.checkpoint_id && ckptId >= before.configurable.checkpoint_id) continue;
        const [serializedCkpt, serializedMeta, parentId] = saved;
        const checkpoint = await this.serde.loadsTyped("json", serializedCkpt);
        const metadata = await this.serde.loadsTyped("json", serializedMeta);
        if (filter && Object.entries(filter).some(([k, v]) => metadata[k] !== v)) continue;
        const tuple = {
          config: { configurable: { thread_id: tid, checkpoint_ns: ns, checkpoint_id: ckptId } },
          checkpoint,
          metadata,
          pendingWrites: [],
        };
        if (parentId) {
          tuple.parentConfig = { configurable: { thread_id: tid, checkpoint_ns: ns, checkpoint_id: parentId } };
        }
        yield tuple;
        count += 1;
        if (limit && count >= limit) return;
      }
    }
  }

  async put(config, checkpoint, metadata) {
    const threadId = safeKey(config.configurable?.thread_id);
    const ns = safeKey(config.configurable?.checkpoint_ns ?? "", true);
    safeKey(checkpoint.id);
    if (!this.cache.storage[threadId]) this.cache.storage[threadId] = {};
    if (!this.cache.storage[threadId][ns]) this.cache.storage[threadId][ns] = {};
    const [, serializedCkpt] = await this.serde.dumpsTyped(checkpoint);
    const [, serializedMeta] = await this.serde.dumpsTyped(metadata);
    this.cache.storage[threadId][ns][checkpoint.id] = [serializedCkpt, serializedMeta, config.configurable?.checkpoint_id];
    this._schedulePersist();
    return { configurable: { thread_id: threadId, checkpoint_ns: ns, checkpoint_id: checkpoint.id } };
  }

  async putWrites(config, writes, taskId) {
    const threadId = safeKey(config.configurable?.thread_id);
    const ns = safeKey(config.configurable?.checkpoint_ns ?? "", true);
    const ckptId = safeKey(config.configurable?.checkpoint_id);
    const outerKey = this._generateKey(threadId, ns, ckptId);
    if (!this.cache.writes[outerKey]) this.cache.writes[outerKey] = {};
    this.cache.writes[outerKey][taskId] = [];
    for (const [channel, value] of writes) {
      const [, serialized] = await this.serde.dumpsTyped(value);
      this.cache.writes[outerKey][taskId].push([taskId, channel, serialized]);
    }
    this._schedulePersist();
  }

  async deleteThread(threadId) {
    safeKey(threadId);
    delete this.cache.storage[threadId];
    for (const k of Object.keys(this.cache.writes)) {
      const [tid] = JSON.parse(k);
      if (tid === threadId) delete this.cache.writes[k];
    }
    try {
      localStorage.setItem(CKPT_KEY, JSON.stringify(this.cache));
    } catch {
      /* ignore */
    }
  }
}

/** ---------- Long-term memory: persistent store ---------- */

export class LocalStorageStore extends BaseStore {
  constructor() {
    super();
    this.cache = LocalStorageStore._load();
    this._saveTimer = null;
  }

  static _load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  _schedulePersist() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(this.cache));
      } catch (e) {
        console.warn("Bravo store: persist failed", e);
      }
    }, 400);
  }

  _nsKey(namespace) {
    return JSON.stringify(namespace);
  }

  async get(namespace, key) {
    const items = this.cache[this._nsKey(namespace)];
    return items?.[key] ? { ...items[key] } : undefined;
  }

  async search(prefix, options = {}) {
    const { limit, offset = 0, filter, query } = options;
    const prefixStr = JSON.stringify(prefix);
    let items = [];
    for (const [nsKey, entries] of Object.entries(this.cache)) {
      if (nsKey.startsWith(prefixStr)) {
        for (const [key, item] of Object.entries(entries)) {
          items.push({ namespace: JSON.parse(nsKey), key, ...item });
        }
      }
    }
    if (filter) {
      items = items.filter((it) => Object.entries(filter).every(([k, v]) => it.value?.[k] === v));
    }
    if (query) {
      const q = query.toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      const scored = items
        .map((it) => {
          const text = String(it.value?.text ?? it.value ?? "").toLowerCase();
          let score = 0;
          for (const t of terms) if (text.includes(t)) score += 1;
          return { it, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score);
      items = scored.map(({ it }) => it);
    } else {
      items.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    }
    if (offset) items = items.slice(offset);
    if (limit) items = items.slice(0, limit);
    return items;
  }

  async put(namespace, key, value) {
    const nsKey = this._nsKey(namespace);
    if (!this.cache[nsKey]) this.cache[nsKey] = {};
    this.cache[nsKey][key] = { value, updatedAt: Date.now() };
    this._schedulePersist();
  }

  async delete(namespace, key) {
    const nsKey = this._nsKey(namespace);
    if (this.cache[nsKey]) {
      delete this.cache[nsKey][key];
      this._schedulePersist();
    }
  }

  async listNamespaces(options = {}) {
    const { limit, offset = 0, prefix } = options;
    let nsKeys = Object.keys(this.cache).map((k) => JSON.parse(k));
    if (prefix) {
      const p = JSON.stringify(prefix).slice(0, -1);
      nsKeys = nsKeys.filter((ns) => JSON.stringify(ns).startsWith(p));
    }
    nsKeys.sort();
    if (offset) nsKeys = nsKeys.slice(offset);
    if (limit) nsKeys = nsKeys.slice(0, limit);
    return nsKeys;
  }

  /** App helper: dump all memories for the settings UI. */
  dumpAll(prefix = ["memories"]) {
    const out = [];
    for (const [nsKey, entries] of Object.entries(this.cache)) {
      if (!nsKey.startsWith(JSON.stringify(prefix).slice(0, -1))) continue;
      for (const [key, item] of Object.entries(entries)) {
        out.push({ namespace: JSON.parse(nsKey), key, ...item });
      }
    }
    return out.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }

  /** App helper: remove everything under the memories prefix. */
  clearAll(prefix = ["memories"]) {
    const p = JSON.stringify(prefix).slice(0, -1);
    for (const nsKey of Object.keys(this.cache)) {
      if (nsKey.startsWith(p)) delete this.cache[nsKey];
    }
    this._schedulePersist();
  }
}
