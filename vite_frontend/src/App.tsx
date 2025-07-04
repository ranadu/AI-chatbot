import React, { useState, useEffect, useRef } from "react";
import "./App.css";

interface Message {
  type: "user" | "bot";
  content: string;
  timestamp: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      type: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://ai-chatbot-8g4u.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: "default", message: input }),
      });

      const data = await res.json();
      const botMessage: Message = {
        type: "bot",
        content: data.response,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        type: "bot",
        content: "Something went wrong. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="chat-header">
        <h1>🤖 Naija Chatbot</h1>
      </div>

      <div className="chat-area">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${msg.type === "user" ? "user-bubble" : "bot-bubble"}`}
          >
            {msg.content}
            <div className="timestamp">{msg.timestamp}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble bot-bubble">
            Bot is typing...
            <div className="timestamp">{new Date().toLocaleTimeString()}</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Ask me anything..."
        />
        <button onClick={handleSend}>➤</button>
      </div>
    </div>
  );
};

export default App;