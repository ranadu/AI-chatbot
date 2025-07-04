import React, { useEffect, useRef, useState } from "react";
import marked from "marked";
import DOMPurify from "dompurify";
import Picker from "emoji-picker-react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

type Message = {
  type: "user" | "bot";
  content: string;
  timestamp: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: uuidv4(), title: "New Chat", messages: [] },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>(
    sessions[0].id
  );
  const [input, setInput] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId)!;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const userMessage: Message = {
      type: "user",
      content: input,
      timestamp,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, userMessage] }
          : s
      )
    );

    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("https://ai-chatbot-8g4u.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMessage: Message = {
        type: "bot",
        content: data.response || "No response",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, botMessage] }
            : s
        )
      );
    } catch (e) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    type: "bot",
                    content: "Sorry, something went wrong.",
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ],
              }
            : s
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleEmojiClick = (event: any, emojiObject: any) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const renderMarkdown = (markdown: string) => {
    const rawHtml = marked.parse(markdown);
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return { __html: cleanHtml };
  };

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const newChat = () => {
    const newSession = {
      id: uuidv4(),
      title: `Chat ${sessions.length + 1}`,
      messages: [],
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
  };

  return (
    <div className={`app-container ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <div className="chat-header">
        <h1>🤖 ChattyBot</h1>
        <div>
          <button onClick={toggleTheme}>🌓</button>
          <button onClick={newChat}>➕</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ width: 200, background: "#1e1e2f", padding: "1rem" }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              style={{
                padding: "0.5rem",
                marginBottom: "0.5rem",
                borderRadius: "8px",
                backgroundColor:
                  s.id === activeSessionId ? "#333354" : "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={() => setActiveSessionId(s.id)}
            >
              {s.title}
            </div>
          ))}
        </div>

        <div className="chat-area">
          {activeSession.messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-bubble ${
                msg.type === "user" ? "user-bubble" : "bot-bubble"
              }`}
            >
              <div dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
              <div className="timestamp">{msg.timestamp}</div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble bot-bubble">
              <em>Bot is typing...</em>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="chat-input-container">
        <button onClick={() => setShowEmojiPicker((prev) => !prev)}>😊</button>
        {showEmojiPicker && (
          <div style={{ position: "absolute", bottom: "60px", left: "20px", zIndex: 1000 }}>
            <Picker onEmojiClick={handleEmojiClick} />
          </div>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>➤</button>
      </div>
    </div>
  );
};

export default App;