import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Picker from 'emoji-picker-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const BACKEND_URL = 'https://ai-chatbot-8g4u.onrender.com/chat';

type Message = {
  type: 'user' | 'bot';
  text: string;
  timestamp: string;
};

type Session = {
  id: string;
  title: string;
  messages: Message[];
};

export default function App() {
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('chat-sessions');
    return saved ? JSON.parse(saved) : [{
      id: uuidv4(),
      title: 'New Chat',
      messages: []
    }];
  });
  const [currentId, setCurrentId] = useState(sessions[0].id);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentId)!;

  const playSound = (type: 'send' | 'receive') => {
    const audio = new Audio(type === 'send' ? '/send.mp3' : '/receive.mp3');
    audio.play();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      type: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedSession: Session = {
      ...currentSession,
      messages: [...currentSession.messages, userMsg]
    };
    updateSession(updatedSession);
    setInput('');
    playSound('send');
    setIsTyping(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentId, message: userMsg.text })
      });

      const data = await res.json();
      const botMsg: Message = {
        type: 'bot',
        text: data.response || 'No response',
        timestamp: new Date().toLocaleTimeString()
      };
      updateSession({
        ...updatedSession,
        messages: [...updatedSession.messages, botMsg]
      });
      playSound('receive');
    } catch (err) {
      updateSession({
        ...updatedSession,
        messages: [...updatedSession.messages, {
          type: 'bot',
          text: '⚠️ Failed to connect.',
          timestamp: new Date().toLocaleTimeString()
        }]
      });
    } finally {
      setIsTyping(false);
    }
  };

  const updateSession = (newSession: Session) => {
    const updated = sessions.map(s => (s.id === newSession.id ? newSession : s));
    setSessions(updated);
    localStorage.setItem('chat-sessions', JSON.stringify(updated));
  };

  const newChat = () => {
    const id = uuidv4();
    const newSesh: Session = { id, title: 'New Chat', messages: [] };
    const updated = [newSesh, ...sessions];
    setSessions(updated);
    setCurrentId(id);
    localStorage.setItem('chat-sessions', JSON.stringify(updated));
  };

  const clearChat = () => {
    const cleared: Session = { ...currentSession, messages: [] };
    updateSession(cleared);
  };

  const toggleMode = () => setDarkMode(prev => !prev);

  const onEmojiClick = (emoji: any) => {
    setInput(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [currentSession.messages, isTyping]);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="chat-header">
        <h1><span className="bot-avatar">🤖</span> AI Chatbot</h1>
        <div>
          <button onClick={toggleMode}>🌓</button>
          <button onClick={newChat}>➕</button>
          <button onClick={clearChat}>🗑️</button>
        </div>
      </div>

      <div style={{ display: 'flex', height: '100%' }}>
        <aside style={{ width: '250px', borderRight: '1px solid #444', padding: '1rem', background: darkMode ? '#111' : '#eee' }}>
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => setCurrentId(s.id)}
              style={{
                cursor: 'pointer',
                fontWeight: s.id === currentId ? 'bold' : 'normal',
                marginBottom: '0.5rem'
              }}
            >
              {s.title || 'Untitled'}
            </div>
          ))}
        </aside>

        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-area" ref={scrollRef}>
            {currentSession.messages.map((msg, i) => {
              const clean = DOMPurify.sanitize(marked.parseSync(msg.text));
              return (
                <div key={i} className={`chat-bubble ${msg.type === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                  <div dangerouslySetInnerHTML={{ __html: clean }} />
                  <div className="timestamp">{msg.timestamp}</div>
                </div>
              );
            })}
            {isTyping && (
              <div className="chat-bubble bot-bubble">
                <em>Bot is typing...</em>
              </div>
            )}
          </div>

          <div className="chat-input-container">
            <button onClick={() => setShowEmojiPicker(prev => !prev)}>😊</button>
            {showEmojiPicker && (
              <div style={{ position: 'absolute', bottom: '70px', zIndex: 999 }}>
                <Picker onEmojiClick={onEmojiClick} />
              </div>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>➤</button>
          </div>
        </main>
      </div>
    </div>
  );
}