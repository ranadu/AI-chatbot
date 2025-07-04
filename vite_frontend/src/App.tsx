import { useEffect, useRef, useState } from "react"
import {
  Box,
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  useTheme,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import Brightness4Icon from "@mui/icons-material/Brightness4"
import Brightness7Icon from "@mui/icons-material/Brightness7"
import { motion } from "framer-motion"
import Picker from "emoji-picker-react"
import axios from "axios"

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

const getTime = () => new Date().toLocaleTimeString()

function App() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [input, setInput] = useState("")
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: crypto.randomUUID(),
      title: "Chat 1",
      messages: [
        {
          type: "bot",
          content: "Naija ChatBot dey here again! Ask your question.",
          timestamp: getTime(),
        },
      ],
    },
  ])
  const [currentSessionIdx, setCurrentSessionIdx] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1976d2",
      },
    },
  })

  const currentSession = sessions[currentSessionIdx]

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = {
      type: "user",
      content: input,
      timestamp: getTime(),
    }

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMsg],
    }

    updateSession(updatedSession)
    setInput("")

    try {
      const res = await axios.post("https://ai-chatbot-8g4u.onrender.com/chat", {
        user: "web",
        message: input,
      })

      const botReply: Message = {
        type: "bot",
        content: res.data.response || res.data.message || "No response",
        timestamp: getTime(),
      }

      updateSession({
        ...updatedSession,
        messages: [...updatedSession.messages, botReply],
      })
    } catch {
      updateSession({
        ...updatedSession,
        messages: [
          ...updatedSession.messages,
          {
            type: "bot",
            content: "Wahala. Something no work. Try again later.",
            timestamp: getTime(),
          },
        ],
      })
    }
  }

  const updateSession = (session: ChatSession) => {
    setSessions((prev) => {
      const copy = [...prev]
      copy[currentSessionIdx] = session
      return copy
    })
  }

  const newChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: `Chat ${sessions.length + 1}`,
      messages: [
        {
          type: "bot",
          content: "Naija ChatBot dey here again! Ask your question.",
          timestamp: getTime(),
        },
      ],
    }
    setSessions([...sessions, newSession])
    setCurrentSessionIdx(sessions.length)
  }

  const handleEmojiClick = (e: any, emojiObject: any) => {
    setInput((prev) => prev + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [currentSession.messages])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ backgroundColor: darkMode ? "#121212" : "#e3f2fd", minHeight: "100vh", p: 2 }}>
        <Container maxWidth="md">
          <Paper elevation={6} sx={{ borderRadius: 4, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">🇳🇬 Naija ChatBot</Typography>
              <Box>
                <Button onClick={newChat} sx={{ mr: 1 }}>NEW CHAT</Button>
                <IconButton onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Box>
            </Box>

            <Tabs value={currentSessionIdx} onChange={(_, newVal) => setCurrentSessionIdx(newVal)} variant="scrollable">
              {sessions.map((session, idx) => (
                <Tab key={session.id} label={session.title} />
              ))}
            </Tabs>

            <Box
              ref={scrollRef}
              sx={{
                height: "60vh",
                overflowY: "auto",
                backgroundColor: darkMode ? "#1e1e1e" : "#fafafa",
                borderRadius: 2,
                p: 2,
                mt: 2,
              }}
            >
              {currentSession.messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <Box
                    display="flex"
                    justifyContent={msg.type === "user" ? "flex-end" : "flex-start"}
                    mb={1}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        backgroundColor: msg.type === "user" ? "#1976d2" : "#ccc",
                        color: msg.type === "user" ? "white" : "black",
                        maxWidth: "75%",
                        boxShadow: 3,
                      }}
                    >
                      <Typography variant="body2">{msg.content}</Typography>
                      <Typography variant="caption" display="block" textAlign="right" mt={0.5}>
                        {msg.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>

            <Box display="flex" alignItems="center" mt={2}>
              <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</IconButton>
              {showEmojiPicker && (
                <Box position="absolute" zIndex={999}>
                  <Picker onEmojiClick={handleEmojiClick} />
                </Box>
              )}
              <TextField
                fullWidth
                placeholder="Ask me anything... 🇳🇬"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                sx={{ mx: 1 }}
              />
              <IconButton onClick={handleSend} color="primary">
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App