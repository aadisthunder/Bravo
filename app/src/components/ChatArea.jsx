import { useRef, useEffect } from "react";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";
import "./ChatArea.css";

export default function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onToggleSidebar,
}) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = textareaRef.current?.value.trim();
    if (!val || isLoading) return;
    onSendMessage(val);
    textareaRef.current.value = "";
    textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-area">
      {/* Header bar */}
      <div className="chat-header">
        <button className="menu-btn" onClick={onToggleSidebar} id="menu-btn">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="chat-header-title">
          <div className="header-dot"></div>
          Vertify
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Messages or Welcome */}
      <div className="chat-messages" id="chat-messages">
        {isEmpty ? (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="welcome-title">How can I help you today?</h2>
            <p className="welcome-subtitle">
              I'm Vertify, your specialized multi-agent research assistant.
            </p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              placeholder="Message Vertify..."
              rows={1}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              disabled={isLoading}
              id="message-input"
            />
            <button
              type="submit"
              className="send-btn"
              disabled={isLoading}
              id="send-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="input-hint">
            Vertify can make mistakes. Verify important information.
          </p>
        </form>
      </div>
    </div>
  );
}
