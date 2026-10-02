import { useEffect, useRef, useState } from "react";
import {
  Menu,
  ArrowUp,
  Square,
  Sparkles,
  Search,
  Calculator,
  Brain,
  Lightbulb,
  Cpu,
  ChevronDown,
  Check,
} from "lucide-react";
import Message from "./Message";
import OnboardingModal from "./OnboardingModal";
import { APP_NAME, SUGGESTIONS, PROVIDERS } from "../lib/constants";
import { getModelInfo, isOnboardingCompleted } from "../lib/onboarding";
import "./ChatView.css";

const SUGGESTION_ICONS = { Search, Calculator, Brain, Lightbulb };

export default function ChatView({
  chat,
  messages,
  isLoading,
  settings,
  onSend,
  onStop,
  onOpenSidebar,
  onOpenSettings,
  onUpdateSettings,
}) {
  const endRef = useRef(null);
  const taRef = useRef(null);
  const modelMenuRef = useRef(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isOnboardingCompleted()) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setIsModelMenuOpen(false);
      }
    };
    if (isModelMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModelMenuOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const submit = () => {
    const val = taRef.current?.value.trim();
    if (!val || isLoading) return;
    onSend(val);
    if (taRef.current) {
      taRef.current.value = "";
      taRef.current.style.height = "auto";
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && settings.sendOnEnter) {
      e.preventDefault();
      submit();
    }
  };

  const autoGrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const useSuggestion = (p) => {
    if (taRef.current) {
      taRef.current.value = p;
      autoGrow();
      taRef.current.focus();
    }
  };

  const isEmpty = messages.length === 0;

  const currentModelInfo = getModelInfo(settings?.model);

  return (
    <main className="chat">
      {/* Mobile-only top-left hamburger icon */}
      <button
        className="mobile-hamburger-btn"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
        title="Open sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="chat-scroll">
        {isEmpty ? (
          <div className="welcome">
            <div className="welcome-mark">
              <img src="/logo.svg" alt="Bravo" className="welcome-logo-img" />
            </div>
            <h1 className="welcome-title">What can I do for you?</h1>
            <p className="welcome-sub">
              {APP_NAME} can search the web, calculate, remember facts and more — powered by LangChain.
            </p>
            <div className="welcome-grid">
              {SUGGESTIONS.map((s) => {
                const Icon = SUGGESTION_ICONS[s.icon] || Sparkles;
                return (
                  <button key={s.title} className="suggestion" onClick={() => useSuggestion(s.prompt)}>
                    <Icon size={16} />
                    <span className="suggestion-title">{s.title}</span>
                    <span className="suggestion-desc">{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((m) => (
              <Message key={m.id} message={m} userName="You" />
            ))}
            {isLoading && !messages.some((m) => m.role === "assistant" && (m.content || m.tools?.length)) && (
              <div className="pending">
                <Sparkles size={15} className="spin" />
                <span>Thinking…</span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <textarea
            ref={taRef}
            className="composer-input"
            placeholder={isLoading ? "Generating — stop or wait…" : "Message Bravo…"}
            rows={1}
            onKeyDown={onKeyDown}
            onInput={autoGrow}
            disabled={isLoading}
          />
          <div className="composer-actions">
            {/* Model Selector Dropdown next to Send */}
            <div className="model-dropdown-anchor" ref={modelMenuRef}>
              <button
                type="button"
                className="model-select-btn"
                onClick={() => setIsModelMenuOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isModelMenuOpen}
                title={`Selected Model: ${currentModelInfo?.label || settings.model}`}
              >
                <Cpu size={14} className="model-select-icon" />
                <span className="model-select-btn-label">
                  {currentModelInfo?.label || settings.model}
                </span>
                <ChevronDown size={13} className={`model-select-chevron ${isModelMenuOpen ? "open" : ""}`} />
              </button>

              {isModelMenuOpen && (
                <div className="model-dropdown-menu" role="listbox">
                  <div className="model-dropdown-title">Select Model</div>
                  {Object.entries(PROVIDERS).map(([providerKey, provider]) => (
                    <div key={providerKey} className="model-dropdown-group">
                      <div className="model-dropdown-group-title">{provider.label}</div>
                      {provider.models.map((m) => {
                        const isSelected = settings.model === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`model-dropdown-item ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              onUpdateSettings?.({ provider: providerKey, model: m.id });
                              setIsModelMenuOpen(false);
                            }}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="model-item-text">
                              <span className="model-item-label">{m.label}</span>
                              <span className="model-item-note">{m.note}</span>
                            </div>
                            {isSelected && <Check size={14} className="model-item-check" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isLoading ? (
              <button className="send-btn stop" onClick={onStop} title="Stop generating" aria-label="Stop">
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button className="send-btn" onClick={submit} title="Send" aria-label="Send">
                <ArrowUp size={17} />
              </button>
            )}
          </div>
        </div>
        <p className="composer-hint">
          Bravo can make mistakes. Verify important information.
        </p>
      </div>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onOpenSettings={onOpenSettings}
      />
    </main>
  );
}
