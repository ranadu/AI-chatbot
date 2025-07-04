import { useEffect, useRef, useState } from "react"
import {
  Container,
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import { motion } from "framer-motion"
import axios from "axios"

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
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

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
    setIsTyping(true)
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

      const botReply: Message = {
        type: "bot",
        content:
          response.data.response ||
          response.data.message ||
          "No response from server.",
        timestamp: new Date().toLocaleTimeString(),
      }

      // Add a typing delay to simulate realism
      setTimeout(() => {
        setMessages((prev) => [...prev, botReply])
        setIsTyping(false)
        setLoading(false)
      }, 1000)
    } catch (err) {
      const errorMsg: Message = {
        type: "bot",
        content: "Wahala. Something no work. Try again later.",
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages([...newMessages, errorMsg])
      setIsTyping(false)
      setLoading(false)
    }
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
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span role="img" aria-label="chatbot" style={{ marginRight: 8 }}>
              🤖
            </span>
            Naija ChatBot
          </Typography>
        </motion.div>

        <Box
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
              whileHover={{ scale: 1.015 }}
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
                    transition: "transform 0.2s ease-in-out",
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {msg.content}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0.5, display: "block", textAlign: msg.type === "user" ? "right" : "left", opacity: 0.6 }}>
                    {msg.timestamp}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
          {isTyping && (
            <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: "#eee",
                  color: "black",
                  boxShadow: 1,
                  fontStyle: "italic",
                }}
              >
                Bot dey type...
              </Box>
            </Box>
          )}
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