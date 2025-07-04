import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Tooltip,
  Fade,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import LightModeIcon from "@mui/icons-material/LightMode"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { nanoid } from "nanoid"
import axios from "axios"
import Picker from "emoji-picker-react"

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

const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

function App() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: nanoid(),
      title: "Chat 1",
      messages: [{ type: "bot" as "bot", content: "Omo! Wetin dey? How far, my guy?", timestamp: getTime() }],
    },
  ])
  const [activeSession, setActiveSession] = useState(0)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleSend = async () => {
    if (!input.trim()) return

    const newMsg: Message = { type: "user", content: input, timestamp: getTime() }
    const updated = [...sessions]
    updated[activeSession].messages.push(newMsg)
    setSessions(updated)
    setInput("")
    setLoading(true)

    try {
      const res = await axios.post("https://ai-chatbot-8g4u.onrender.com/chat", {
        user: "web",
        message: newMsg.content,
      })

      const botResponse: Message = {
        type: "bot",
        content: res.data.response || res.data.message || "No response",
        timestamp: getTime(),
      }

      updated[activeSession].messages.push(botResponse)
      setSessions([...updated])
    } catch {
      updated[activeSession].messages.push({
        type: "bot",
        content: "Wahala. Something no work. Try again later.",
        timestamp: getTime(),
      })
      setSessions([...updated])
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: nanoid(),
      title: `Chat ${sessions.length + 1}`,
      messages: [{ type: "bot" as "bot", content: "Omo! Wetin dey? How far, my guy?", timestamp: getTime() }],
    }
    setSessions([...sessions, newSession])
    setActiveSession(sessions.length)
  }

  const handleClear = () => {
    const updated = [...sessions]
    updated[activeSession].messages = []
    setSessions(updated)
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [sessions[activeSession].messages])

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: darkMode
          ? "radial-gradient(circle at top left, #0f0c29, #302b63, #000)"
          : "linear-gradient(135deg, #f0f4ff, #d9e4ff)",
        transition: "background 0.4s ease-in-out",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Container maxWidth="md" component={Paper} elevation={12} sx={{
        p: 3,
        borderRadius: 4,
        background: darkMode ? "#1e1e2f" : "#fff",
        color: darkMode ? "#fff" : "#000",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5" fontWeight="bold">
            🤖 Naija ChatBot
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="New Chat"><IconButton onClick={handleNewChat}><AddIcon /></IconButton></Tooltip>
            <Tooltip title="Clear Chat"><IconButton onClick={handleClear}><DeleteIcon /></IconButton></Tooltip>
            <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
              <IconButton onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Tabs
          value={activeSession}
          onChange={(_, val) => setActiveSession(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {sessions.map((sesh, i) => (
            <Tab key={sesh.id} label={sesh.title} />
          ))}
        </Tabs>

        <Box sx={{
          flex: 1,
          overflowY: "auto",
          pr: 1,
          mb: 2,
          display: "flex",
          flexDirection: "column",
        }}>
          {sessions[activeSession].messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: msg.type === "user" ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                  mb: 1,
                }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    px: 2,
                    py: 1,
                    maxWidth: "75%",
                    backgroundColor: msg.type === "user" ? "#1976d2" : (darkMode ? "#333" : "#eee"),
                    color: msg.type === "user" ? "#fff" : (darkMode ? "#fff" : "#000"),
                    borderRadius: 3,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      transition: "0.2s ease-in-out",
                    },
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.6 }}>
                    {msg.timestamp}
                  </Typography>
                </Paper>
              </Box>
            </motion.div>
          ))}
          {loading && (
            <Typography variant="body2" align="center" sx={{ opacity: 0.6, mb: 2 }}>
              Bot is typing...
            </Typography>
          )}
          <div ref={scrollRef} />
        </Box>

        <Fade in timeout={800}>
          <Box display="flex" gap={1} flexDirection="column">
            {showEmoji && (
              <Box sx={{ mb: 1, alignSelf: "flex-start" }}>
                <Picker
                  onEmojiClick={(e, emojiObj) => setInput(prev => prev + emojiObj.emoji)}
                  skinTonesDisabled
                  searchDisabled
                />
              </Box>
            )}
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                placeholder="Ask me anything... 🇳🇬"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                variant="outlined"
              />
              <IconButton onClick={() => setShowEmoji(p => !p)}>
                😊
              </IconButton>
              <IconButton onClick={handleSend} color="primary">
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}

export default App