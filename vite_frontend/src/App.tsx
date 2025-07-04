import React, { useState } from 'react';
import {
  Box, Container, TextField, IconButton, Paper, Typography, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { motion } from 'framer-motion';
import axios from 'axios';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('https://ai-chatbot-8g4u.onrender.com/chat', {
        user: 'robert',
        message: userMessage.text,
      });
      const botMessage = { sender: 'bot', text: res.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "Something went wrong. Try again later." },
      ]);
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ pt: 4 }}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
        🧠 Naija ChatBot
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 2, minHeight: '60vh', maxHeight: '60vh', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: msg.sender === 'user' ? '#cce5ff' : '#f0f0f0',
                  maxWidth: '70%',
                }}
              >
                <Typography>{msg.text}</Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          placeholder="Ask me anything... 🇳🇬"
          disabled={loading}
        />
        <IconButton color="primary" onClick={sendMessage} disabled={loading}>
          <SendIcon />
        </IconButton>
      </Box>
    </Container>
  );
}