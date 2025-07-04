import React, { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Picker } from "emoji-picker-react";
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
    {
      id: uuidv4(),
      title: "New Chat",
      messages: [],
    },
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

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const userMsg: Message = {
      type: "user",
      content: input,
      timestamp,
    };

    const updatedSessions = sessions.map((s) =>
      s.id === activeSessionId
        ? { ...s, messages: [...s.messages, userMsg] }
        : s
    );
    setSessions(updatedSessions);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("https://ai-chatbot-8g4u.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMsg.content }),
      });

      const data = await response.json();
      const botMsg: Message = {
        type: "bot",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, botMsg] }
            : s
        )
      );
    } catch (err) {
      const errorMsg: Message = {
        type: "bot",
        content: "Sorry, something went wrong.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleEmojiClick = (emoji: any) => {
    setInput((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    const newSession: ChatSession = {
      id: newId,
      title: `Chat ${sessions.length + 1}`,
      messages: [],
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newId);
  };

  const renderMessageContent = (content: string) => {
    const raw = marked.parse(content);
    const clean = DOMPurify.sanitize(raw);
    return { __html: clean };
  };

  return (
    <div className={`app-container ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <div className="chat-header">
        <div className="chat-title">
          🤖 ChattyBot
        </div>
        <div className="chat-actions">
          <button onClick={toggleTheme}>🌓</button>
          <button onClick={handleNewChat}>➕</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ width: 200, background: "#1e1e2f", padding: "1rem" }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                padding: "0.5rem",
                marginBottom: "0.5rem",
                backgroundColor:
                  session.id === activeSessionId ? "#2d2d44" : "transparent",
                color: "white",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={() => setActiveSessionId(session.id)}
            >
              {session.title}
            </div>
          ))}
        </div>

        <div className="chat-area">
          {activeSession.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${
                msg.type === "user" ? "user-bubble" : "bot-bubble"
              }`}
            >
              <div dangerouslySetInnerHTML={renderMessageContent(msg.content)} />
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
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>➤</button>
      </div>
    </div>
  );
};

export default App;