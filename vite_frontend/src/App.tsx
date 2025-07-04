import { useState, useEffect, useRef } from "react"
import {
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  Button,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
  createTheme,
  ThemeProvider,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import DeleteIcon from "@mui/icons-material/Delete"
import Brightness4Icon from "@mui/icons-material/Brightness4"
import Brightness7Icon from "@mui/icons-material/Brightness7"
import { motion } from "framer-motion"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
  const [darkMode, setDarkMode] = useState(prefersDarkMode)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
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
  const [activeSessionIndex, setActiveSessionIndex] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const currentMessages = sessions[activeSessionIndex].messages
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages, loading])

  const handleSend = async () => {
    if (!input.trim()) return

    const timestamp = new Date().toLocaleTimeString()
    const userMessage: Message = { type: "user", content: input, timestamp }

    const updatedSessions = [...sessions]
    updatedSessions[activeSessionIndex].messages.push(userMessage)
    setSessions(updatedSessions)
    setInput("")
    setLoading(true)

    try {
      const response = await axios.post(
        "https://ai-chatbot-8g4u.onrender.com/chat",
        {
          user: "web",
          message: userMessage.content,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      )

      const botContent = response.data.response || response.data.message || "No response"
      const botMessage: Message = {
        type: "bot",
        content: botContent,
        timestamp: new Date().toLocaleTimeString(),
      }

      updatedSessions[activeSessionIndex].messages.push(botMessage)
      setSessions([...updatedSessions])
    } catch (err) {
      updatedSessions[activeSessionIndex].messages.push({
        type: "bot",
        content: "Wahala. Something no work. Try again later.",
        timestamp: new Date().toLocaleTimeString(),
      })
      setSessions([...updatedSessions])
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setSessions([
      ...sessions,
      {
        id: uuidv4(),
        title: `Chat ${sessions.length + 1}`,
        messages: [
          {
            type: "bot",
            content: "Omo! Wetin dey? How far, my guy?",
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      },
    ])
    setActiveSessionIndex(sessions.length)
  }

  const handleClearChat = () => {
    const updated = [...sessions]
    updated[activeSessionIndex].messages = []
    setSessions(updated)
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      background: {
        default: darkMode ? "#121212" : "#f5f5f5",
        paper: darkMode ? "#1e1e1e" : "#fff",
      },
    },
    typography: {
      fontFamily: `"Comic Neue", "Arial", sans-serif`,
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
          p: 2,
        }}
      >
        <Container
          maxWidth="md"
          component={Paper}
          elevation={8}
          sx={{
            borderRadius: 3,
            p: 2,
            display: "flex",
            flexDirection: "column",
            minHeight: "90vh",
          }}
        >
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight="bold">
              🤖 Naija ChatBot
            </Typography>
            <Box>
              <Tooltip title="Toggle Theme">
                <IconButton onClick={() => setDarkMode((prev) => !prev)}>
                  {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="New Chat">
                <Button onClick={handleNewChat} variant="outlined" sx={{ ml: 1 }}>
                  New Chat
                </Button>
              </Tooltip>
              <Tooltip title="Clear Chat">
                <IconButton onClick={handleClearChat} color="error" sx={{ ml: 1 }}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeSessionIndex}
            onChange={(_, newValue) => setActiveSessionIndex(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            {sessions.map((session, idx) => (
              <Tab key={session.id} label={session.title} />
            ))}
          </Tabs>

          {/* Chat Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 1,
              mb: 2,
              backgroundColor: darkMode ? "#121212" : "#f9f9f9",
              borderRadius: 2,
              border: "1px solid",
              borderColor: darkMode ? "#333" : "#ccc",
            }}
          >
            {currentMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Box
                  display="flex"
                  justifyContent={msg.type === "user" ? "flex-end" : "flex-start"}
                  mb={1.5}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      maxWidth: "75%",
                      backgroundColor: msg.type === "user" ? "#1976d2" : "#eeeeee",
                      color: msg.type === "user" ? "white" : "black",
                      boxShadow: 1,
                      ":hover": {
                        transform: "translateY(-2px)",
                        transition: "transform 0.2s ease-in-out",
                      },
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    <Typography variant="caption" sx={{ mt: 0.5, display: "block", opacity: 0.6 }}>
                      {msg.timestamp}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
            {loading && (
              <Typography variant="body2" align="center" sx={{ mt: 2, opacity: 0.7 }}>
                Bot is typing...
              </Typography>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask me anything... 🇳🇬"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                😀
              </IconButton>
              <IconButton color="primary" onClick={handleSend}>
                <SendIcon />
              </IconButton>
            </Box>
            {showEmojiPicker && (
              <Box sx={{ mt: 1 }}>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </Box>
            )}
          </motion.div>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App