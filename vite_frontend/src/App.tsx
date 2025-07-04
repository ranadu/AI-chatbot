import { useState, useEffect, useRef } from "react";
import "./App.css";
import Picker from "emoji-picker-react";
import { marked } from "marked";
import DOMPurify from "dompurify";

const BACKEND_URL = "https://ai-chatbot-8g4u.onrender.com/chat";

type Message = {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

export default function App() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    { id: crypto.randomUUID(), title: "New Chat", messages: [] },
  ]);
  const [activeChatId, setActiveChatId] = useState(chatSessions[0].id);
  const [input, setInput] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeChat = chatSessions.find((c) => c.id === activeChatId)!;

  useEffect(() => {
    scrollToBottom();
  }, [activeChat.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const playSendSound = () => {
    const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_f8e2236631.mp3?filename=click-124467.mp3");
    audio.play();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString(),
    };
    updateMessages(userMsg);
    setInput("");
    playSendSound();
    setIsTyping(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: activeChatId, message: input }),
      });

      const data = await res.json();
      const botMsg: Message = {
        sender: "bot",
        text: data.response || "Sorry, something went wrong.",
        timestamp: new Date().toLocaleTimeString(),
      };
      updateMessages(botMsg);
    } catch {
      updateMessages({
        sender: "bot",
        text: "Sorry, something went wrong.",
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const updateMessages = (msg: Message) => {
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? { ...s, messages: [...s.messages, msg] }
          : s
      )
    );
  };

  const renderMessage = (msg: Message, idx: number) => {
    const sanitized = DOMPurify.sanitize(marked.parse(msg.text));
    return (
      <div
        key={idx}
        className={`chat-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}`}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      >
      </div>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: `Chat ${chatSessions.length + 1}`,
      messages: [],
    };
    setChatSessions((prev) => [...prev, newSession]);
    setActiveChatId(newSession.id);
  };

  const clearMessages = () => {
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId ? { ...s, messages: [] } : s
      )
    );
  };

  return (
    <div className={`app-container ${isDark ? "dark-mode" : "light-mode"}`}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar */}
        <div style={{ width: "200px", backgroundColor: isDark ? "#1e1e2e" : "#f0f0f0", padding: "1rem" }}>
          <button onClick={handleNewChat}>New Chat</button>
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              style={{
                marginTop: "1rem",
                padding: "0.5rem",
                borderRadius: "8px",
                background: chat.id === activeChatId ? (isDark ? "#444" : "#ccc") : "transparent",
                cursor: "pointer",
              }}
            >
              {chat.title}
            </div>
          ))}
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div className="chat-header">
            <h1>🤖 AI Chatbot</h1>
            <div>
              <button onClick={() => setIsDark((d) => !d)}>🌓</button>
              <button onClick={handleNewChat}>➕</button>
              <button onClick={clearMessages}>🗑️</button>
            </div>
          </div>

          {/* Chat */}
          <div className="chat-area">
            {activeChat.messages.map((msg, i) => (
              <div key={i}>
                {renderMessage(msg, i)}
                <div className="timestamp">{msg.timestamp}</div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble bot-bubble"><em>Bot is typing...</em></div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-container">
            <button onClick={() => setShowEmoji((v) => !v)}>😊</button>
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button onClick={handleSend}>➤</button>
          </div>
          {showEmoji && (
            <div style={{ position: "absolute", bottom: "70px", left: "20px", zIndex: 1000 }}>
              <Picker
                onEmojiClick={(emojiData) => {
                  setInput((prev) => prev + emojiData.emoji);
                  setShowEmoji(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}