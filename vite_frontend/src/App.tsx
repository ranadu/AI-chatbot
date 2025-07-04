import { useEffect, useRef, useState } from "react"
import {
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import RestartAltIcon from "@mui/icons-material/RestartAlt"
import DeleteIcon from "@mui/icons-material/Delete"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import { motion } from "framer-motion"
import axios from "axios"
import Picker from "@emoji-mart/react"
import data from "@emoji-mart/data"

type Message = {
  type: "user" | "bot"
  content: string
  timestamp: string
  reaction?: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("chatHistory")
    return saved ? JSON.parse(saved) : [{ type: "bot", content: "Omo! Wetin dey? How far, my guy?", timestamp: new Date().toLocaleTimeString() }]
  })

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showEmojiPickerIndex, setShowEmojiPickerIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
    localStorage.setItem("chatHistory", JSON.stringify(messages))
  }, [messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" })
    }, 100)
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const timestamp = new Date().toLocaleTimeString()
    const newMessages: Message[] = [...messages, { type: "user", content: input, timestamp }]
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
          headers: { "Content-Type": "application/json" },
        }
      )

      const botContent: string = response.data.response || response.data.message || "No response"
      const newBotMsg: Message = { type: "bot", content: botContent, timestamp: new Date().toLocaleTimeString() }

      setTimeout(() => {
        setMessages([...newMessages, newBotMsg])
        setLoading(false)
      }, 800) // Simulate "typing..." delay
    } catch {
      setMessages([
        ...newMessages,
        { type: "bot", content: "Wahala. Something no work. Try again later.", timestamp: new Date().toLocaleTimeString() },
      ])
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    const history = localStorage.getItem("chatHistory")
    if (history) {
      const allSessions = JSON.parse(localStorage.getItem("allChats") || "[]")
      allSessions.push(JSON.parse(history))
      localStorage.setItem("allChats", JSON.stringify(allSessions))
    }

    setMessages([{ type: "bot", content: "Omo! Wetin dey? How far, my guy?", timestamp: new Date().toLocaleTimeString() }])
    localStorage.removeItem("chatHistory")
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleReaction = (emoji: any, index: number) => {
    const newMessages = [...messages]
    newMessages[index].reaction = emoji.native
    setMessages(newMessages)
    setShowEmojiPickerIndex(null)
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 2,
      }}
    >
      <Container
        maxWidth="sm"
        component={Paper}
        elevation={8}
        sx={{
          padding: 3,
          borderRadius: 3,
          background: "#fff",
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography
            variant="h5"
            align="center"
            sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            <span role="img" aria-label="chatbot" style={{ marginRight: 8 }}>
              🤖
            </span>
            Naija ChatBot
          </Typography>
          <Box>
            <Tooltip title="New Chat">
              <IconButton onClick={handleNewChat}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Chat">
              <IconButton onClick={() => setMessages([])}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  onMouseEnter={() => setShowEmojiPickerIndex(i)}
                  onMouseLeave={() => setShowEmojiPickerIndex(null)}
                  sx={{
                    position: "relative",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: "75%",
                    backgroundColor: msg.type === "user" ? "#1976d2" : "#eee",
                    color: msg.type === "user" ? "white" : "black",
                    boxShadow: 1,
                    cursor: "pointer",
                    "&:hover": { transform: "translateY(-2px)", transition: "0.2s" },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    {msg.type === "bot" && <span>🤖</span>}
                    {msg.type === "user" && <span>🧍‍♂️</span>}
                    <Typography variant="body1">{msg.content}</Typography>
                    {msg.reaction && <span>{msg.reaction}</span>}
                    <Tooltip title="Copy">
                      <IconButton size="small" onClick={() => handleCopy(msg.content)}>
                        <ContentCopyIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" color="gray" display="block" mt={0.5}>
                    {msg.timestamp}
                  </Typography>
                  {showEmojiPickerIndex === i && (
                    <Box sx={{ position: "absolute", top: "-350%", right: 0, zIndex: 10 }}>
                      <Picker data={data} onEmojiSelect={(e) => handleReaction(e, i)} />
                    </Box>
                  )}
                </Box>
              </Box>
            </motion.div>
          ))}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask me anything... 🇳🇬"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
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