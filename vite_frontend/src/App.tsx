// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Picker from 'emoji-picker-react';
import './App.css';

type Message = {
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

const BACKEND_URL = 'https://ai-chatbot-8g4u.onrender.com';

function App() {
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const defaultSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
    };
    setSessions([defaultSession]);
    setCurrentSessionId(defaultSession.id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId]);

  const getCurrentSession = (): ChatSession | undefined =>
    sessions.find((s) => s.id === currentSessionId);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedSessions = sessions.map((session) =>
      session.id === currentSessionId
        ? {
            ...session,
            messages: [...session.messages, userMessage],
          }
        : session
    );

    setSessions(updatedSessions);
    setInput('');
    setIsBotTyping(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage: Message = {
        type: 'bot',
        content: data.response,
        timestamp: new Date().toLocaleTimeString(),
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, botMessage],
              }
            : session
        )
      );

      if (audioRef.current) audioRef.current.play();
    } catch (err) {
      console.error(err);
    }

    setIsBotTyping(false);
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleClearHistory = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId ? { ...s, messages: [] } : s
      )
    );
  };

  const onEmojiClick = (emojiObject: any) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="chat-header">
        <h1>
          <span className="bot-avatar">🤖</span> AI Chatbot
        </h1>
        <div>
          <button onClick={toggleTheme}>🌓</button>
          <button onClick={handleNewSession}>➕</button>
          <button onClick={handleClearHistory}>🗑️</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexGrow: 1 }}>
        <div
          style={{
            width: '200px',
            background: darkMode ? '#141427' : '#f0f0f0',
            overflowY: 'auto',
            padding: '1rem',
            borderRight: darkMode ? '1px solid #333' : '1px solid #ddd',
          }}
        >
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              style={{
                padding: '0.5rem',
                marginBottom: '0.5rem',
                background:
                  s.id === currentSessionId
                    ? darkMode
                      ? '#2a2a40'
                      : '#d0d0ff'
                    : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {s.title}
            </div>
          ))}
        </div>

        <div className="chat-area">
          {getCurrentSession()?.messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.type === 'user' ? 'user-bubble' : 'bot-bubble'}`}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked.parse(msg.content)),
              }}
            />
          ))}
          {isBotTyping && (
            <div className="bot-bubble chat-bubble">
              <em>Bot is typing...</em>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>
      </div>

      <div className="chat-input-container">
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
        {showEmojiPicker && (
          <div style={{ position: 'absolute', bottom: '80px', left: '10px', zIndex: 999 }}>
            <Picker onEmojiClick={onEmojiClick} />
          </div>
        )}
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>📤</button>
      </div>

      <audio ref={audioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3" />
    </div>
  );
}

export default App;