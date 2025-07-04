import { useState, useEffect, useRef } from "react"
import {
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Switch,
  Tooltip,
  Button,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import DeleteIcon from "@mui/icons-material/Delete"
import LightModeIcon from "@mui/icons-material/LightMode"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import { motion } from "framer-motion"
import axios from "axios"

type Message = {
  type: "user" | "bot"
  content: string
  timestamp: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: "Omo! Wetin dey? How far, my guy?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const containerRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      type: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

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

      const botMessage: Message = {
        type: "bot",
        content:
          response.data.response || response.data.message || "No response",
        timestamp: new Date().toLocaleTimeString(),
      }

      setTimeout(() => {
        setMessages([...newMessages, botMessage])
        setLoading(false)
      }, 600) // Simulate "typing..." delay
    } catch {
      setMessages([
        ...newMessages,
        {
          type: "bot",
          content: "Wahala. Something no work. Try again later.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
      setLoading(false)
    }
  }

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  const clearMessages = () => {
    setMessages([
      {
        type: "bot",
        content: "Omo! Wetin dey? How far, my guy?",
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }

  const isDark = theme === "dark"

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(135deg, #121212, #1e1e1e)"
          : "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 2,
      }}
    >
      <Container
        maxWidth="sm"
        component={Paper}
        elevation={10}
        sx={{
          padding: 3,
          borderRadius: 3,
          background: isDark ? "#1e1e1e" : "#fff",
          color: isDark ? "#fff" : "#000",
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}>
            🤖&nbsp;Naija ChatBot
          </Typography>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Tooltip title="Toggle Dark Mode">
              <Switch
                checked={isDark}
                onChange={handleThemeToggle}
                icon={<LightModeIcon />}
                checkedIcon={<DarkModeIcon />}
              />
            </Tooltip>
            <Tooltip title="Clear Chat">
              <IconButton color="error" onClick={clearMessages}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Chat Messages */}
        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            overflowY: "auto",
            mb: 2,
            pr: 1,
          }}
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <Box
                sx={{
                  mb: 1.5,
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
                    backgroundColor:
                      msg.type === "user" ? "#1976d2" : isDark ? "#333" : "#eee",
                    color: msg.type === "user" ? "white" : isDark ? "#eee" : "#000",
                    boxShadow: 1,
                    fontSize: "0.95rem",
                  }}
                >
                  <div>{msg.content}</div>
                  <Typography variant="caption" sx={{ opacity: 0.6, fontSize: "0.7rem", mt: 0.5 }}>
                    {msg.timestamp}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                Bot dey type...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask me anything... 🇳🇬"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              sx={{
                input: {
                  color: isDark ? "#fff" : "#000",
                },
              }}
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