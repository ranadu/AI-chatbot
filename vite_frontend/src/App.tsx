import { useEffect, useRef, useState } from "react"
import {
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  Button,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import { motion } from "framer-motion"
import axios from "axios"
import EmojiPicker from "emoji-picker-react"
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions"

type Message = {
  type: "user" | "bot"
  content: string
  timestamp?: string
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const handleSend = async () => {
    if (!input.trim()) return

    const newMessages: Message[] = [
      ...messages,
      {
        type: "user",
        content: input,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const response = await axios.post(
        "https://ai-chatbot-8g4u.onrender.com/chat",
        { user: "web", message: input },
        { headers: { "Content-Type": "application/json" } }
      )

      const botMessage: string =
        response.data.response || response.data.message || "No response"

      setMessages([
        ...newMessages,
        {
          type: "bot",
          content: botMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    } catch {
      setMessages([
        ...newMessages,
        {
          type: "bot",
          content: "Wahala. Something no work. Try again later.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji)
  }

  const handleNewChat = () => {
    setMessages([
      {
        type: "bot",
        content: "Naija ChatBot dey here again! Ask your question.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
    setInput("")
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            🤖 Naija ChatBot
          </Typography>
          <Button onClick={handleNewChat} variant="outlined" size="small">
            New Chat
          </Button>
        </Box>

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
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: "75%",
                    backgroundColor: msg.type === "user" ? "#1976d2" : "#eee",
                    color: msg.type === "user" ? "white" : "black",
                    boxShadow: 1,
                    position: "relative",
                  }}
                >
                  {msg.content}
                  <Typography variant="caption" sx={{ ml: 1, display: "block" }}>
                    {msg.timestamp}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
          {loading && (
            <Typography align="center" sx={{ opacity: 0.6 }}>
              Typing...
            </Typography>
          )}
          <div ref={bottomRef}></div>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
            <EmojiEmotionsIcon />
          </IconButton>
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

        {showEmojiPicker && (
          <Box sx={{ mt: 1 }}>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default App