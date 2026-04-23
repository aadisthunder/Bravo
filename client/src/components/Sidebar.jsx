import "./Sidebar.css";

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  isMobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={onCloseMobile} />
      )}
      <aside className={`sidebar ${isMobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="brand-text">
              <h1>Vertify</h1>
              <span className="brand-tagline">
                Specialized Research Assistant
              </span>
            </div>
          </div>
          <button
            className="new-chat-btn"
            onClick={onNewChat}
            id="new-chat-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="sidebar-chats">
          <div className="chats-label">Recent Chats</div>
          {chats.length === 0 ? (
            <div className="no-chats">
              <p>No conversations yet</p>
              <p className="no-chats-hint">Start a new chat to begin</p>
            </div>
          ) : (
            <ul className="chat-list">
              {chats.map((chat) => (
                <li
                  key={chat.id}
                  className={`chat-item ${chat.id === activeChatId ? "chat-item-active" : ""}`}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onCloseMobile();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="chat-item-title">{chat.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="model-badge">
            <div className="model-dot"></div>
            Developed By Aaditya Parkash
          </div>
        </div>
      </aside>
    </>
  );
}
