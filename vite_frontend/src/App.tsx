import { useEffect, useRef, useState } from "react"
import {
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Switch,
  Tabs,
  Tab,
  Tooltip,
  Fade,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import DeleteIcon from "@mui/icons-material/Delete"
import { motion } from "framer-motion"
import axios from "axios"
import EmojiPicker from "emoji-picker-react"
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { nanoid } from "nanoid"

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

const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: nanoid(),
      title: "New Chat",
      messages: [{ type: "bot", content: "Omo! Wetin dey? How far, my guy?", timestamp: getTime() }],
    },
  ])
  const [currentSessionIdx, setCurrentSessionIdx] = useState(0)
  const [input, setInput] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentMessages = sessions[currentSessionIdx].messages

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { type: "user", content: input, timestamp: getTime() }
    const newMessages = [...currentMessages, userMessage]

    updateSessionMessages(newMessages)
    setInput("")

    const botReply: Message = {
      type: "bot",
      content: "Typing...",
      timestamp: getTime(),
    }
    updateSessionMessages([...newMessages, botReply])

    try {
      const response = await axios.post(
        "https://ai-chatbot-8g4u.onrender.com/chat",
        { user: "web", message: input },
        { headers: { "Content-Type": "application/json" } }
      )

      const finalBotMsg: Message = {
        type: "bot",
        content: response.data.response || response.data.message || "No response",
        timestamp: getTime(),
      }

      updateSessionMessages([...newMessages, finalBotMsg])
    } catch {
      updateSessionMessages([
        ...newMessages,
        { type: "bot", content: "Wahala. Something no work. Try again later.", timestamp: getTime() },
      ])
    }
  }

  const updateSessionMessages = (msgs: Message[]) => {
    const updatedSessions = [...sessions]
    updatedSessions[currentSessionIdx].messages = msgs
    setSessions(updatedSessions)
  }

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: nanoid(),
      title: `Chat ${sessions.length + 1}`,
      messages: [{ type: "bot", content: "Omo! Wetin dey? How far, my guy?", timestamp: getTime() }],
    }
    setSessions([...sessions, newSession])
    setCurrentSessionIdx(sessions.length)
  }

  const handleClearChat = () => {
    const cleared = {
      ...sessions[currentSessionIdx],
      messages: [{ type: "bot", content: "Omo! Wetin dey? How far, my guy?", timestamp: getTime() }],
    }
    const updated = [...sessions]
    updated[currentSessionIdx] = cleared
    setSessions(updated)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [sessions, currentSessionIdx])

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      background: {
        default: darkMode ? "#121212" : "#f5f5f5",
        paper: darkMode ? "#1e1e1e" : "#fff",
      },
      primary: {
        main: darkMode ? "#90caf9" : "#1976d2",
      },
    },
    typography: {
      fontFamily: "Comic Sans MS, sans-serif",
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="static">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6">Naija ChatBot 🇳🇬</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2">Dark Mode</Typography>
              <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              <Tooltip title="New Chat">
                <IconButton onClick={handleNewChat} color="inherit">
                  🆕
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear Chat">
                <IconButton onClick={handleClearChat} color="inherit">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        <Tabs
          value={currentSessionIdx}
          onChange={(_, newValue) => setCurrentSessionIdx(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {sessions.map((session) => (
            <Tab key={session.id} label={session.title} />
          ))}
        </Tabs>

        <Container maxWidth="md" sx={{ py: 2 }}>
          <Paper elevation={6} sx={{ p: 3, borderRadius: 4, minHeight: "70vh", display: "flex", flexDirection: "column" }}>
            <Box ref={containerRef} sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
              {currentMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, x: msg.type === "user" ? 50 : -50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 150 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                      mb: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        maxWidth: "75%",
                        bgcolor: msg.type === "user" ? "primary.main" : "grey.300",
                        color: msg.type === "user" ? "white" : "black",
                        borderRadius: 3,
                        boxShadow: 2,
                        position: "relative",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.03)" },
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                      <Typography variant="caption" sx={{ position: "absolute", bottom: -16, right: 8 }}>
                        {msg.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>

            {showEmoji && (
              <Box sx={{ my: 1 }}>
                <EmojiPicker onEmojiClick={(emojiData) => setInput((prev) => prev + emojiData.emoji)} />
              </Box>
            )}

            <Fade in>
              <Box sx={{ display: "flex", mt: 2, gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask me anything... 🇳🇬"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <IconButton color="primary" onClick={() => setShowEmoji((prev) => !prev)}>
                  <EmojiEmotionsIcon />
                </IconButton>
                <IconButton color="primary" onClick={handleSend}>
                  <SendIcon />
                </IconButton>
              </Box>
            </Fade>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App