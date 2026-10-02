import { useState } from "react";
import { Plus, Settings, MessageSquare, Trash2 } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "../lib/constants";
import "./Sidebar.css";

export default function Sidebar({
  chats,
  activeChatId,
  view,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSettings,
  isMobileOpen,
  onCloseMobile,
  settings,
}) {
  return (
    <>
      {isMobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} />}
      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 19 L9 5 L12 13 L15 5 L20 19" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">{APP_NAME}</span>
            <span className="brand-tag">{APP_TAGLINE}</span>
          </div>
        </div>

        {/* New chat */}
        <div className="sidebar-newchat">
          <button className="btn btn-primary newchat-btn" onClick={onNewChat}>
            <Plus size={16} />
            New chat
          </button>
        </div>

        {/* Chat history */}
        <nav className="sidebar-chats">
          <div className="sidebar-label">Recent</div>
          {chats.length === 0 && (
            <div className="sidebar-empty">
              <MessageSquare size={18} strokeWidth={1.6} />
              <span>No conversations yet</span>
            </div>
          )}
          <ul className="chat-list">
            {chats.map((chat) => (
              <li
                key={chat.id}
                className={`chat-item ${chat.id === activeChatId && view === "chat" ? "active" : ""}`}
              >
                <button className="chat-item-btn" onClick={() => onSelectChat(chat.id)} title={chat.title}>
                  <span className="chat-item-title">{chat.title}</span>
                </button>
                <button
                  className="chat-item-delete icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer options — the consistent sidebar layout system */}
        <div className="sidebar-footer">
          <button
            className={`footer-option ${view === "settings" ? "active" : ""}`}
            onClick={onOpenSettings}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
