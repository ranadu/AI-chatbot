import { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  IconButton,
  TextField,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Switch,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatIcon from "@mui/icons-material/Chat";
import EmojiPicker from "emoji-picker-react";
import { motion } from "framer-motion";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

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

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: "Omo! Wetin dey? How far, my guy?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    const newMessages: Message[] = [
      ...messages,
      { type: "user", content: input, timestamp },
    ];

    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await axios.post(
        "https://ai-chatbot-8g4u.onrender.com/chat",
        {
          user: "web",
          message: input,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const botContent: string =
        response.data.response || response.data.message || "No response";
      const botTimestamp = new Date().toLocaleTimeString();

      const botMessage: Message = {
        type: "bot",
        content: botContent,
        timestamp: botTimestamp,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "Wahala. Something no work. Try again later.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: `Chat ${chatSessions.length + 1}`,
      messages: messages,
    };

    setChatSessions([newSession, ...chatSessions]);
    setMessages([
      {
        type: "bot",
        content: "Na fresh chat be dis. Wetin you wan talk?",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setSelectedChatId(null);
  };

  const handleClearChats = () => {
    setChatSessions([]);
    setMessages([
      {
        type: "bot",
        content: "I don clear everything. We go start fresh.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleSelectChat = (session: ChatSession) => {
    setMessages(session.messages);
    setSelectedChatId(session.id);
  };

  const handleEmojiClick = (emojiObject: any) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const themeStyles = {
    background: darkMode ? "#121212" : "#f9f9f9",
    color: darkMode ? "#fff" : "#000",
    inputBg: darkMode ? "#333" : "#fff",
    inputText: darkMode ? "#fff" : "#000",
    botBg: darkMode ? "#2d2d2d" : "#eee",
    userBg: "#1976d2",
  };

  return (
    <Box sx={{ background: themeStyles.background, minHeight: "100vh" }}>
      <AppBar position="static" color="primary">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">🇳🇬 Naija ChatBot</Typography>
          <Box>
            <Tooltip title="New Chat">
              <IconButton color="inherit" onClick={handleNewChat}>
                <ChatIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear History">
              <IconButton color="inherit" onClick={handleClearChats}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Dark Mode">
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex" }}>
        {/* Left sidebar: chat history */}
        <Box
          sx={{
            width: isMobile ? "0" : "240px",
            borderRight: darkMode ? "1px solid #444" : "1px solid #ccc",
            display: isMobile ? "none" : "block",
          }}
        >
          <List>
            {chatSessions.map((session) => (
              <ListItem
                key={session.id}
                button
                onClick={() => handleSelectChat(session)}
              >
                <ListItemText primary={session.title} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Main chat window */}
        <Container
          maxWidth="md"
          sx={{
            flex: 1,
            py: 4,
            display: "flex",
            flexDirection: "column",
            height: "90vh",
          }}
        >
          <Paper
            elevation={6}
            sx={{
              flex: 1,
              p: 3,
              borderRadius: 2,
              overflowY: "auto",
              backgroundColor: themeStyles.background,
            }}
          >
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent:
                      msg.type === "user" ? "flex-end" : "flex-start",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 3,
                      maxWidth: "75%",
                      backgroundColor:
                        msg.type === "user"
                          ? themeStyles.userBg
                          : themeStyles.botBg,
                      color: msg.type === "user" ? "#fff" : themeStyles.color,
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Typography variant="body1">{msg.content}</Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 1, opacity: 0.7 }}
                    >
                      {msg.timestamp}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
            {isTyping && (
              <Box sx={{ display: "flex", justifyContent: "flex-start", pl: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: themeStyles.color, fontStyle: "italic" }}
                >
                  Bot dey type...
                </Typography>
              </Box>
            )}
            <div ref={chatEndRef} />
          </Paper>

          {/* Input area */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your gist here... 🇳🇬"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              sx={{
                backgroundColor: themeStyles.inputBg,
                color: themeStyles.inputText,
                borderRadius: 2,
              }}
              InputProps={{
                style: { color: themeStyles.inputText },
              }}
            />
            <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              😊
            </IconButton>
            <IconButton color="primary" onClick={handleSend}>
              <SendIcon />
            </IconButton>
            {showEmojiPicker && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: "100px",
                  zIndex: 10,
                }}
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default App;