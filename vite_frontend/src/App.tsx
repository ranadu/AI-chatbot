import React, { useState, useEffect, useRef } from 'react';
import {
  TextField, IconButton, AppBar, Toolbar, Typography, Tooltip, List, ListItemButton, CssBaseline
} from '@mui/material';
import { Send, Brightness4, Brightness7, Delete, Add, InsertEmoticon } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Picker from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
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

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: uuidv4(), title: 'New Chat', messages: [] }
  ]);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const [darkMode, setDarkMode] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  const activeSession = sessions.find(s => s.id === activeSessionId)!;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedSessions = sessions.map(session =>
      session.id === activeSessionId
        ? {
            ...session,
            messages: [...session.messages, newMessage]
          }
        : session
    );

    setSessions(updatedSessions);
    setInput('');
    setIsTyping(true);

    scrollToBottom();

    // Simulate bot delay
    setTimeout(async () => {
      const response = await fetch('https://ai-chatbot-api.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.content })
      });

      const data = await response.json();

      const botMessage: Message = {
        type: 'bot',
        content: data.reply || 'Sorry, something went wrong.',
        timestamp: new Date().toLocaleTimeString()
      };

      const updatedSessionsWithBot = sessions.map(session =>
        session.id === activeSessionId
          ? {
              ...session,
              messages: [...session.messages, newMessage, botMessage]
            }
          : session
      );

      setSessions(updatedSessionsWithBot);
      setIsTyping(false);
    }, 1000);
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const startNewChat = () => {
    const newId = uuidv4();
    const newSession: ChatSession = {
      id: newId,
      title: `Chat ${sessions.length + 1}`,
      messages: []
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newId);
  };

  const clearChat = () => {
    const cleared = sessions.map(s =>
      s.id === activeSessionId ? { ...s, messages: [] } : s
    );
    setSessions(cleared);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <AppBar position="static" className="chat-header">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>🤖 ChattyBot</Typography>
            <Tooltip title="Toggle Theme">
              <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
            <Tooltip title="New Chat">
              <IconButton color="inherit" onClick={startNewChat}>
                <Add />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Chat">
              <IconButton color="inherit" onClick={clearChat}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: '220px', background: darkMode ? '#1e1e2f' : '#f0f0f0', overflowY: 'auto' }}>
            <List>
              {sessions.map((s) => (
                <ListItemButton
                  key={s.id}
                  selected={s.id === activeSessionId}
                  onClick={() => setActiveSessionId(s.id)}
                >
                  {s.title}
                </ListItemButton>
              ))}
            </List>
          </div>

          <div className="chat-area">
            {activeSession.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-bubble ${msg.type === 'user' ? 'user-bubble' : 'bot-bubble'}`}
              >
                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                <div className="timestamp">{msg.timestamp}</div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble bot-bubble">
                <em>Bot is typing...</em>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chat-input-container">
          <IconButton onClick={() => setShowEmojiPicker(prev => !prev)}>
            <InsertEmoticon />
          </IconButton>
          {showEmojiPicker && (
            <div style={{ position: 'absolute', bottom: '80px', left: '20px', zIndex: 10 }}>
              <Picker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          <TextField
            fullWidth
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <IconButton onClick={handleSend} color="primary">
            <Send />
          </IconButton>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;