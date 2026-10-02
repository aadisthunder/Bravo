import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  KeyRound,
  Cpu,
  Brain,
  Shield,
  Wrench,
  Activity,
  Palette,
  ScrollText,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Check,
  CircleAlert,
  ExternalLink,
  MemoryStick,
  Eraser,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { PROVIDERS, APP_NAME } from "../lib/constants";
import { validateKey } from "../lib/models";
import { setTheme } from "../lib/theme";
import { getStore } from "../lib/agent";
import { buildSystemPrompt } from "../lib/agent";
import "./SettingsView.css";

/* ---------- Small building blocks ---------- */

function Section({ icon: Icon, title, desc, children }) {
  return (
    <section className="set-section">
      <div className="set-section-head">
        <div className="set-section-icon">
          <Icon size={16} />
        </div>
        <div>
          <h2 className="set-section-title">{title}</h2>
          {desc && <p className="set-section-desc">{desc}</p>}
        </div>
      </div>
      <div className="set-section-body">{children}</div>
    </section>
  );
}

function Row({ label, hint, children, vertical }) {
  return (
    <div className={`set-row ${vertical ? "vertical" : ""}`}>
      <div className="set-row-text">
        <span className="set-row-label">{label}</span>
        {hint && <span className="set-row-hint">{hint}</span>}
      </div>
      <div className="set-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      className={`toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label="Toggle"
    />
  );
}

function KeyField({ id, value, placeholder, onCommit, testId, docsUrl }) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState(value);
  const [state, setState] = useState(null); // {ok, message}

  useEffect(() => setDraft(value), [value]);

  const test = async () => {
    setState({ busy: true });
    const r = await validateKey(testId, draft.trim());
    setState({ ...r });
  };

  return (
    <div className="key-field">
      <div className="key-input-row">
        <div className="key-input-wrap">
          <input
            className="field-input mono"
            type={show ? "text" : "password"}
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onCommit(draft.trim())}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="key-eye" onClick={() => setShow((s) => !s)} title={show ? "Hide" : "Show"}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button className="btn" onClick={test} disabled={!draft.trim() || state?.busy}>
          {state?.busy ? "Testing…" : "Test"}
        </button>
        {docsUrl && (
          <a className="btn key-docs" href={docsUrl} target="_blank" rel="noreferrer" title="Get a key">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      {state && !state.busy && (
        <p className={`key-state ${state.ok ? "ok" : "bad"}`}>
          {state.ok ? <Check size={13} /> : <CircleAlert size={13} />}
          {state.message}
        </p>
      )}
    </div>
  );
}

/* ---------- Main settings view ---------- */

export default function SettingsView({ settings, onChange, onBack }) {
  const [newBlocked, setNewBlocked] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [promptPreview, setPromptPreview] = useState(null);
  const store = getStore();
  const [, force] = useState(0);

  const memories = useMemo(() => store.dumpAll(["memories"]), [store, settings.longTermMemory, settings.memories, force]);

  const providerMeta = PROVIDERS[settings.provider] || PROVIDERS.gemini;
  const set = (k) => (e) => onChange({ [k]: e.target.value });
  const setNum = (k) => (e) => onChange({ [k]: Number(e.target.value) });
  const setBool = (k) => (v) => onChange({ [k]: v });

  const toggleTool = (name) => onChange({ toolToggles: { ...settings.toolToggles, [name]: !settings.toolToggles?.[name] } });

  const addBlocked = () => {
    const w = newBlocked.trim();
    if (!w) return;
    onChange({ blockedWords: [...(settings.blockedWords || []), w] });
    setNewBlocked("");
  };

  const addMemory = () => {
    const t = newMemory.trim();
    if (!t) return;
    const key = `mem_${Date.now().toString(36)}`;
    store.put(["memories", "bravo-user"], key, { text: t, createdAt: Date.now() });
    setNewMemory("");
    force((n) => n + 1);
  };

  const deleteMemory = (ns, key) => {
    store.delete(ns, key);
    force((n) => n + 1);
  };

  const clearMemories = () => {
    store.clearAll(["memories"]);
    force((n) => n + 1);
  };

  const showPrompt = () => {
    setPromptPreview(buildSystemPrompt(settings, memories));
  };

  return (
    <main className="settings">
      <header className="settings-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to chat">
          <ArrowLeft size={18} />
        </button>
        <h1 className="settings-title">Settings</h1>
        <span className="chip">{APP_NAME}</span>
      </header>

      <div className="settings-scroll">
        {/* ---------- Agent instruction ---------- */}
        <Section
          icon={Bot}
          title="Agent instruction"
          desc="The system prompt Bravo follows on every message."
        >
          <textarea
            className="field-textarea"
            value={settings.agentInstruction}
            onChange={set("agentInstruction")}
            rows={5}
          />
          <div className="set-actions">
            <button className="btn" onClick={showPrompt}>
              <ScrollText size={14} />
              See the full system prompt
            </button>
          </div>
          {promptPreview !== null && (
            <pre className="prompt-preview mono">{promptPreview}</pre>
          )}
          <Row label="History depth" hint="How many past messages the model sees each turn.">
            <input
              type="range"
              min="4"
              max="50"
              value={settings.historyDepth}
              onChange={setNum("historyDepth")}
              style={{ width: 140 }}
            />
            <span className="mono range-val">{settings.historyDepth}</span>
          </Row>
        </Section>

        {/* ---------- Model ---------- */}
        <Section icon={Cpu} title="Model" desc="Provider, model id and generation knobs.">
          <Row label="Provider" vertical>
            <div className="provider-tabs">
              {Object.values(PROVIDERS).map((p) => (
                <button
                  key={p.id}
                  className={`provider-tab ${settings.provider === p.id ? "active" : ""}`}
                  onClick={() => {
                    const first = p.models[0];
                    onChange({ provider: p.id, model: first.id });
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Model" vertical>
            <select className="field-select" value={settings.model} onChange={set("model")}>
              {providerMeta.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.note}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Temperature" hint="Higher = more creative, lower = more focused.">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={settings.temperature}
              onChange={setNum("temperature")}
              style={{ width: 140 }}
            />
            <span className="mono range-val">{Number(settings.temperature).toFixed(1)}</span>
          </Row>
          <Row label="Max tokens" hint="Upper bound on the length of each reply.">
            <input
              className="field-input"
              type="number"
              min="256"
              max="8192"
              step="256"
              value={settings.maxTokens}
              onChange={setNum("maxTokens")}
              style={{ width: 120 }}
            />
          </Row>
        </Section>

        {/* ---------- API keys ---------- */}
        <Section
          icon={KeyRound}
          title="API keys"
          desc="Your keys are stored only in this browser (localStorage) and sent directly to each provider."
        >
          <Row label="Gemini API key" vertical>
            <KeyField
              testId="gemini"
              value={settings.geminiApiKey}
              placeholder="AIza… / AQ.…"
              onCommit={(v) => onChange({ geminiApiKey: v })}
              docsUrl={PROVIDERS.gemini.docsUrl}
            />
          </Row>
          <Row label="Groq API key" vertical>
            <KeyField
              testId="groq"
              value={settings.groqApiKey}
              placeholder="gsk_…"
              onCommit={(v) => onChange({ groqApiKey: v })}
              docsUrl={PROVIDERS.groq.docsUrl}
            />
          </Row>
          <Row label="Tavily API key" hint="Required for the web_search tool." vertical>
            <KeyField
              testId="tavily"
              value={settings.tavilyApiKey}
              placeholder="tvly-…"
              onCommit={(v) => onChange({ tavilyApiKey: v })}
              docsUrl="https://app.tavily.com/home"
            />
          </Row>
        </Section>

        {/* ---------- Memory ---------- */}
        <Section
          icon={Brain}
          title="Memory"
          desc="Short-term memory persists the conversation thread; long-term memory stores facts across chats."
        >
          <Row label="Short-term memory" hint="Remembers the current conversation (LangGraph checkpointer).">
            <Toggle checked={settings.shortTermMemory} onChange={setBool("shortTermMemory")} />
          </Row>
          <Row label="Long-term memory" hint="Cross-chat facts via a LangGraph Store.">
            <Toggle checked={settings.longTermMemory} onChange={setBool("longTermMemory")} />
          </Row>
          <Row label="Auto memory tool" hint="Let the agent save facts on its own with memory_save.">
            <Toggle
              checked={settings.toolToggles?.memory_save}
              onChange={() => toggleTool("memory_save")}
            />
          </Row>

          <div className="memory-block">
            <div className="memory-add">
              <input
                className="field-input"
                placeholder="Add a memory manually, e.g. “I prefer concise answers”"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMemory()}
              />
              <button className="btn" onClick={addMemory} disabled={!newMemory.trim()}>
                <Plus size={14} />
                Add
              </button>
            </div>

            {memories.length === 0 ? (
              <p className="memory-empty">
                <MemoryStick size={15} />
                No long-term memories yet. Tell Bravo something about yourself, or add one above.
              </p>
            ) : (
              <ul className="memory-list">
                {memories.map((m) => (
                  <li key={m.key} className="memory-item">
                    <span className="memory-text">{m.value?.text}</span>
                    <button
                      className="icon-btn memory-del"
                      onClick={() => deleteMemory(m.namespace, m.key)}
                      title="Delete memory"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {memories.length > 0 && (
              <div className="set-actions">
                <button className="btn btn-danger" onClick={clearMemories}>
                  <Eraser size={14} />
                  Clear all memories
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* ---------- Guardrails ---------- */}
        <Section
          icon={Shield}
          title="Guardrails"
          desc="Deterministic checks around every request — no surprises."
        >
          <Row label="Enable guardrails" hint="Master switch for all rails.">
            <Toggle checked={settings.guardrailsEnabled} onChange={setBool("guardrailsEnabled")} />
          </Row>
          <Row label="Max output characters" hint="Longer replies are truncated by the output rail.">
            <input
              className="field-input"
              type="number"
              min="1000"
              max="50000"
              step="500"
              value={settings.maxOutputChars}
              onChange={setNum("maxOutputChars")}
              style={{ width: 120 }}
            />
          </Row>

          <div className="memory-block">
            <span className="set-row-label">Blocked rules</span>
            <p className="set-row-hint">
              Substrings or regex checked against each user message. Built-in safety rules always apply.
            </p>
            <div className="memory-add">
              <input
                className="field-input"
                placeholder="Add a word or /regex/"
                value={newBlocked}
                onChange={(e) => setNewBlocked(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBlocked()}
              />
              <button className="btn" onClick={addBlocked} disabled={!newBlocked.trim()}>
                <Plus size={14} />
                Add
              </button>
            </div>
            {(settings.blockedWords?.length ?? 0) > 0 && (
              <div className="chip-list">
                {settings.blockedWords.map((w, i) => (
                  <span key={i} className="chip">
                    {w}
                    <button
                      className="chip-x"
                      onClick={() => onChange({ blockedWords: settings.blockedWords.filter((_, j) => j !== i) })}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ---------- Tools ---------- */}
        <Section icon={Wrench} title="Tools" desc="Capabilities the agent can call. Tavily search needs its key above.">
          {[
            ["web_search", "Web search", "Live web results via Tavily"],
            ["calculator", "Calculator", "Deterministic arithmetic"],
            ["current_time", "Current time", "Local date & time"],
            ["memory_save", "Memory save", "Write facts to long-term memory"],
          ].map(([id, label, hint]) => (
            <Row key={id} label={label} hint={hint}>
              <Toggle checked={!!settings.toolToggles?.[id]} onChange={() => toggleTool(id)} />
            </Row>
          ))}
        </Section>

        {/* ---------- LangSmith ---------- */}
        <Section
          icon={Activity}
          title="LangSmith tracing"
          desc="Send full run traces (agent, model, tools) to LangSmith for observability."
        >
          <Row label="Enable tracing" hint="Requires a LangSmith API key.">
            <Toggle checked={settings.langsmithEnabled} onChange={setBool("langsmithEnabled")} />
          </Row>
          <Row label="API key" vertical>
            <KeyField
              testId="langsmith"
              value={settings.langsmithApiKey}
              placeholder="lsv2_pt_…"
              onCommit={(v) => onChange({ langsmithApiKey: v })}
              docsUrl="https://smith.langchain.com/settings"
            />
          </Row>
          <Row label="Project" hint="Traces are grouped under this project name.">
            <input
              className="field-input"
              value={settings.langsmithProject}
              onChange={set("langsmithProject")}
              style={{ width: 180 }}
            />
          </Row>
          <Row label="Endpoint" vertical>
            <input
              className="field-input mono"
              value={settings.langsmithEndpoint}
              onChange={set("langsmithEndpoint")}
            />
          </Row>
        </Section>

        {/* ---------- Appearance ---------- */}
        <Section icon={Palette} title="Appearance" desc="Theme and input behavior.">
          <Row label="Theme" hint="Light, dark, or follow your system (default).">
            <div className="provider-tabs">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System (Default)", icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`provider-tab ${settings.theme === id ? "active" : ""}`}
                  onClick={() => {
                    setTheme(id);
                    onChange({ theme: id });
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Row>
          <Row label="Send on Enter" hint="Off: Enter adds a newline, use the arrow to send.">
            <Toggle checked={settings.sendOnEnter} onChange={setBool("sendOnEnter")} />
          </Row>
        </Section>

        <footer className="settings-footer">
          <p>
            {APP_NAME} · built with LangChain, LangGraph, LangSmith · keys stay in your browser
          </p>
        </footer>
      </div>
    </main>
  );
}
