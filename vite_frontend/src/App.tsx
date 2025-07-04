import { useState, useRef, useEffect } from "react"
import {
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  Tooltip,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Button,
  useMediaQuery,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import DeleteIcon from "@mui/icons-material/Delete"
import LightModeIcon from "@mui/icons-material/LightMode"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import { motion } from "framer-motion"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"

type Message = {
  type: "user" | "bot"
  content: string
  timestamp: string
}

type ChatSession = {
  id: string
  title: string
  messages: Message[]
}

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: uuidv4(),
      title: "New Chat",
      messages: [
        {
          type: "bot",
          content: "Omo! Wetin dey? How far, my guy?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    },
  ])
  const [currentSession, setCurrentSession] = useState(0)
  const [input, setInput] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const isMobile = useMediaQuery("(max-width:600px)")

  const currentMessages = sessions[currentSession].messages

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentMessages])

  const handleSend = async () => {
    if (!input.trim()) return

    const timestamp = new Date().toLocaleTimeString()
    const userMsg: Message = { type: "user", content: input, timestamp }
    const updatedMessages = [...currentMessages, userMsg]
    const updatedSessions = [...sessions]
    updatedSessions[currentSession].messages = updatedMessages
    setSessions(updatedSessions)
    setInput("")

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
      )
      const botReply: Message = {
        type: "bot",
        content: response.data.response || "No response",
        timestamp: new Date().toLocaleTimeString(),
      }
      updatedSessions[currentSession].messages.push(botReply)
      setSessions([...updatedSessions])
    } catch {
      const errorMsg: Message = {
        type: "bot",
        content: "Wahala. Something no work. Try again later.",
        timestamp: new Date().toLocaleTimeString(),
      }
      updatedSessions[currentSession].messages.push(errorMsg)
      setSessions([...updatedSessions])
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji)
  }

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: `Chat ${sessions.length + 1}`,
      messages: [
        {
          type: "bot",
          content: "Omo! Wetin dey? How far, my guy?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    }
    setSessions([...sessions, newSession])
    setCurrentSession(sessions.length)
  }

  const clearCurrentChat = () => {
    const cleared = [...sessions]
    cleared[currentSession].messages = [
      {
        type: "bot",
        content: "Omo! Wetin dey? How far, my guy?",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]
    setSessions(cleared)
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#121212" : "#f5f5f5",
        color: darkMode ? "#fff" : "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="static" sx={{ bgcolor: darkMode ? "#1f1f2e" : "#1976d2" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">Naija ChatBot 🇳🇬</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Toggle Theme">
              <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="New Chat">
              <Button variant="outlined" color="inherit" onClick={startNewChat}>
                New Chat
              </Button>
            </Tooltip>
            <Tooltip title="Clear Chat">
              <IconButton color="inherit" onClick={clearCurrentChat}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Tabs
        value={currentSession}
        onChange={(_, newValue) => setCurrentSession(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          bgcolor: darkMode ? "#191931" : "#e0e0e0",
        }}
      >
        {sessions.map((s) => (
          <Tab key={s.id} label={s.title} />
        ))}
      </Tabs>

      <Container
        maxWidth="md"
        component={Paper}
        elevation={6}
        sx={{
          flex: 1,
          mt: 2,
          mb: 1,
          p: isMobile ? 1 : 3,
          borderRadius: 3,
          background: darkMode ? "#262641" : "#ffffff",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {currentMessages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.type === "user" ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: "75%",
                  backgroundColor: msg.type === "user" ? "#2196f3" : "#e0e0e0",
                  color: msg.type === "user" ? "#fff" : "#000",
                  boxShadow: 2,
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.02)",
                  },
                }}
              >
                <Typography>{msg.content}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  {msg.timestamp}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </Container>

      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Talk to your guy... 🇳🇬"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            sx={{ animation: "fadeIn 1s ease-in-out" }}
          />
          <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
            😊
          </IconButton>
          <IconButton color="primary" onClick={handleSend}>
            <SendIcon />
          </IconButton>
        </Box>
        {showEmojiPicker && (
          <Box mt={1}>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default App