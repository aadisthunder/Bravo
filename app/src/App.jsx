import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import SettingsView from "./components/SettingsView";
import { runAgent } from "./lib/agent";
import { loadChats, persistChats, makeChat, chatTitleFrom, generateId } from "./lib/chats";
import { loadSettings, saveSettings } from "./lib/settings";
import "./App.css";

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [chats, setChats] = useState(loadChats);
  const [activeChatId, setActiveChatId] = useState(null);
  const [view, setView] = useState("chat"); // "chat" | "settings"
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile drawer

  const abortRef = useRef(null);
  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  // Persist chats whenever they change
  useEffect(() => {
    persistChats(chats);
  }, [chats]);

  const patchChat = useCallback((chatId, fn) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? fn(c) : c)));
  }, []);

  const handleSettingsChange = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setView("chat");
    setIsSidebarOpen(false);
  }, []);

  const handleSelectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    setView("chat");
    setIsSidebarOpen(false);
  }, []);

  const handleDeleteChat = useCallback(
    (chatId) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setActiveChatId((prev) => (prev === chatId ? null : prev));
    },
    [],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Main send flow — streams agent events into the active chat. */
  const handleSend = useCallback(
    async (content) => {
      if (isLoading) return;
      const settingsNow = loadSettings();

      // Ensure a chat exists
      let chatId = activeChatId;
      let baseMessages = messages;
      if (!chatId) {
        const chat = makeChat(chatTitleFrom(content));
        chat.messages = [{ id: generateId(), role: "user", content }];
        chatId = chat.id;
        setChats((prev) => [chat, ...prev]);
        setActiveChatId(chatId);
        baseMessages = chat.messages;
      } else {
        const userMsg = { id: generateId(), role: "user", content };
        baseMessages = [...messages, userMsg];
        patchChat(chatId, (c) => ({ ...c, messages: [...c.messages, userMsg], updatedAt: Date.now() }));
      }

      const aiId = generateId();
      patchChat(chatId, (c) => ({
        ...c,
        messages: [...c.messages, { id: aiId, role: "assistant", content: "", tools: [], error: null }],
      }));

      setIsLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const updateAi = (fn) =>
        patchChat(chatId, (c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === aiId ? fn(m) : m)),
        }));

      try {
        for await (const ev of runAgent({
          chatId,
          messages: baseMessages,
          settings: settingsNow,
          signal: controller.signal,
        })) {
          if (ev.type === "token") {
            updateAi((m) => ({ ...m, content: m.content + ev.value }));
          } else if (ev.type === "tool-start") {
            updateAi((m) => ({
              ...m,
              tools: [...(m.tools ?? []), { name: ev.name, args: ev.args, result: null, running: true }],
            }));
          } else if (ev.type === "tool-end") {
            updateAi((m) => {
              const tools = [...(m.tools ?? [])];
              const idx = tools.findIndex((t) => t.running);
              if (idx >= 0) tools[idx] = { ...tools[idx], result: ev.result, running: false };
              else tools.push({ name: ev.name, args: {}, result: ev.result, running: false });
              return { ...m, tools };
            });
          } else if (ev.type === "done") {
            updateAi((m) => ({ ...m, content: ev.message.content || m.content }));
          } else if (ev.type === "error") {
            updateAi((m) => ({ ...m, error: { kind: ev.kind, message: ev.message, detail: ev.detail } }));
          }
        }
      } catch (e) {
        updateAi((m) => ({ ...m, error: { kind: "unknown", message: e.message } }));
      } finally {
        updateAi((m) => ({ ...m, tools: (m.tools ?? []).map((t) => ({ ...t, running: false })) }));
        setIsLoading(false);
        abortRef.current = null;
        patchChat(chatId, (c) => ({ ...c, updatedAt: Date.now() }));
      }
    },
    [activeChatId, messages, isLoading, patchChat],
  );

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        view={view}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => {
          setView("settings");
          setIsSidebarOpen(false);
        }}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        settings={settings}
      />
      {view === "chat" ? (
        <ChatView
          key={activeChatId ?? "new"}
          chat={activeChat}
          messages={messages}
          isLoading={isLoading}
          settings={settings}
          onSend={handleSend}
          onStop={handleStop}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenSettings={() => setView("settings")}
          onUpdateSettings={handleSettingsChange}
        />
      ) : (
        <SettingsView
          settings={settings}
          onChange={handleSettingsChange}
          onBack={() => setView("chat")}
        />
      )}
    </div>
  );
}
