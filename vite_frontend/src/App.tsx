import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Picker from "emoji-picker-react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

interface Message {
  type: "user" | "bot";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

const App = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const chatAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedChats = localStorage.getItem("chatSessions");
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChatSessions(parsed);
      setCurrentSessionId(parsed[0]?.id || "");
      setMessages(parsed[0]?.messages || []);
    } else {
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatAreaRef.current?.scrollTo({ top: chatAreaRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      type: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);
    setInput("");

    try {
      const res = await fetch("https://ai-chatbot-8g4u.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage: Message = {
        type: "bot",
        content: data.response,
        timestamp: new Date().toLocaleTimeString(),
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      saveChatSession(currentSessionId, finalMessages);
    } catch (err) {
      console.error("Failed to fetch: ", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (_: any, emojiObject: any) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const saveChatSession = (id: string, newMessages: Message[]) => {
    const updatedSessions = chatSessions.map((session) =>
      session.id === id ? { ...session, messages: newMessages } : session
    );
    setChatSessions(updatedSessions);
    localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    const newSession: ChatSession = {
      id: newId,
      title: `Chat ${chatSessions.length + 1}`,
      messages: [],
    };
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    setCurrentSessionId(newId);
    setMessages([]);
    localStorage.setItem("chatSessions", JSON.stringify(updatedSessions));
  };

  const handleSwitchChat = (id: string) => {
    const session = chatSessions.find((s) => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
    }
  };

  const renderMarkdown = (text: string) => {
    const html = marked(text);
    return { __html: DOMPurify.sanitize(html) };
  };

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <div className="chat-header">
        <h1><span className="bot-avatar">🤖</span> AI Chatbot</h1>
        <div>
          <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? "🌞" : "🌙"}</button>
          <button onClick={handleNewChat}>➕ New Chat</button>
        </div>
      </div>

      <div className="chat-history" style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 1rem", overflowX: "auto" }}>
        {chatSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => handleSwitchChat(session.id)}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "12px",
              backgroundColor: session.id === currentSessionId ? "#4e6cff" : "#ccc",
              color: session.id === currentSessionId ? "#fff" : "#111",
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}>
            {session.title}
          </button>
        ))}
      </div>

      <div ref={chatAreaRef} className="chat-area">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.type === "user" ? "user-bubble" : "bot-bubble"}`}>
            <div dangerouslySetInnerHTML={renderMarkdown(msg.content)}></div>
            <div className="timestamp">{msg.timestamp}</div>
          </div>
        ))}
        {loading && <div className="chat-bubble bot-bubble">Bot is typing...</div>}
      </div>

      <div className="chat-input-container">
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
        {showEmojiPicker && <Picker onEmojiClick={handleEmojiClick} />}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>➤</button>
      </div>
    </div>
  );
};

export default App;