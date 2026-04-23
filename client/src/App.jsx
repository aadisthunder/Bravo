import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { sendMessage } from './utils/api';
import './App.css';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getChatTitle(content) {
  const title = content.slice(0, 40).replace(/\n/g, ' ');
  return title.length < content.length ? title + '…' : title;
}

export default function App() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setIsMobileSidebarOpen(false);
  }, []);

  const handleSelectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
  }, []);

  const handleSendMessage = useCallback(async (content) => {
    let chatId = activeChatId;
    let currentMessages = messages;

    // Create new chat if needed
    if (!chatId) {
      chatId = generateId();
      const newChat = {
        id: chatId,
        title: getChatTitle(content),
        messages: [],
        createdAt: Date.now(),
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(chatId);
      currentMessages = [];
    }

    // Add user message
    const userMessage = { id: generateId(), role: 'user', content };
    const updatedMessages = [...currentMessages, userMessage];

    setChats(prev =>
      prev.map(c =>
        c.id === chatId ? { ...c, messages: updatedMessages } : c
      )
    );

    setIsLoading(true);

    // Initial placeholder message for the AI
    const aiMessageId = generateId();
    setChats(prev =>
      prev.map(c =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...updatedMessages,
                { id: aiMessageId, role: 'assistant', content: "Starting agents..." }
              ]
            }
          : c
      )
    );

    try {
      const response = await sendMessage(updatedMessages, (currentProgress) => {
        setChats(prev =>
          prev.map(c =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map(m => 
                    m.id === aiMessageId ? { ...m, content: currentProgress } : m
                  )
                }
              : c
          )
        );
      });
      // final update is identical to the last progress
      setChats(prev =>
        prev.map(c =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map(m => 
                  m.id === aiMessageId ? { ...m, content: response } : m
                )
              }
            : c
        )
      );
    } catch (error) {
      const errorMessage = `⚠️ **Error:** ${error.message}\n\nPlease try again. If the issue persists, the API may be temporarily unavailable.`;

      setChats(prev =>
        prev.map(c =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map(m => 
                  m.id === aiMessageId ? { ...m, content: errorMessage } : m
                )
              }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeChatId, messages]);

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <ChatArea
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
      />
    </div>
  );
}
