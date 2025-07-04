import { useEffect, useRef, useState } from "react"
import {
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  Switch,
  AppBar,
  Toolbar,
  Button,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import { motion } from "framer-motion"
import axios from "axios"

const THEME_KEY = "naija-chatbot-theme"
const HISTORY_KEY = "naija-chatbot-history"

interface Message {
  type: "user" | "bot"
  content: string
  timestamp: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem(THEME_KEY) === "dark"
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedHistory = localStorage.getItem(HISTORY_KEY)
    if (storedHistory) {
      setMessages(JSON.parse(storedHistory))
    } else {
      setMessages([
        {
          type: "bot",
          content: "Omo! Wetin dey? How far, my guy?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages))
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      type: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      const response = await axios.post(
        "https://ai-chatbot-8g4u.onrender.com/chat",
        { user: "web", message: input },
        { headers: { "Content-Type": "application/json" } }
      )

      const botMessage: Message = {
        type: "bot",
        content:
          response.data.response ||
          response.data.message ||
          "No response received",
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "Wahala. Something no work. Try again later.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }
  }

  const toggleTheme = () => {
    const newTheme = !darkMode
    setDarkMode(newTheme)
    localStorage.setItem(THEME_KEY, newTheme ? "dark" : "light")
  }

  const clearChat = () => {
    setMessages([
      {
        type: "bot",
        content: "Naija ChatBot ready. Ask me something!",
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
    localStorage.removeItem(HISTORY_KEY)
  }

  const themeStyles = {
    background: darkMode
      ? "linear-gradient(135deg, #0f0c29, #302b63, #24243e)"
      : "#f3f3f3",
    textColor: darkMode ? "#fff" : "#000",
    bubbleBot: darkMode ? "#eee" : "#ddd",
    bubbleUser: darkMode ? "#1976d2" : "#1565c0",
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: themeStyles.background,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="static" color={darkMode ? "default" : "primary"}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">Naija ChatBot 🇳🇬</Typography>
          <Box>
            <Button onClick={clearChat} color="inherit">
              New Chat
            </Button>
            <Switch checked={darkMode} onChange={toggleTheme} />
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="sm"
        component={Paper}
        elevation={8}
        sx={{
          flex: 1,
          marginTop: 2,
          padding: 3,
          borderRadius: 3,
          background: darkMode ? "#1a1a1a" : "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ flex: 1, overflowY: "auto", mb: 2, pr: 1 }}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  mb: 1.5,
                  display: "flex",
                  justifyContent:
                    msg.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: "75%",
                    backgroundColor:
                      msg.type === "user"
                        ? themeStyles.bubbleUser
                        : themeStyles.bubbleBot,
                    color: msg.type === "user" ? "white" : themeStyles.textColor,
                    boxShadow: 1,
                    cursor: "default",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, opacity: 0.6 }}
                  >
                    {msg.timestamp}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask me anything... 🇳🇬"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              autoFocus
            />
            <IconButton color="primary" onClick={handleSend}>
              <SendIcon />
            </IconButton>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}

export default App