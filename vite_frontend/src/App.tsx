import { useState, useEffect, useRef } from "react"
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
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", content: "Omo! Wetin dey? How far, my guy?" },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSend = async () => {
    if (!input.trim()) return

    const newMessages: Message[] = [...messages, { type: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const response = await axios.post(
        "https://ai-chatbot-8g4u.onrender.com/chat",
        new URLSearchParams({ user: "web", message: input }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      )

      const botMessage = response.data.response
      setMessages([...newMessages, { type: "bot", content: botMessage }])
    } catch (error) {
      setMessages([
        ...newMessages,
        { type: "bot", content: "Wahala. Something no work. Try again later." },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
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
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Box
                sx={{
                  mb: 1.5,
                  display: "flex",
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "16px",
                    maxWidth: "75%",
                    backgroundColor: msg.type === "user" ? "#1976d2" : "#eee",
                    color: msg.type === "user" ? "white" : "black",
                    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {msg.content}
                </motion.div>
              </Box>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", justifyContent: "center", marginTop: 12 }}
            >
              <CircularProgress size={24} />
            </motion.div>
          )}
          <div ref={scrollRef} />
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <motion.div
            whileFocus={{ scale: 1.02 }}
            whileHover={{ scale: 1.01 }}
            style={{ flexGrow: 1 }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask me anything... 🇳🇬"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </motion.div>
          <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.2 }}>
            <IconButton color="primary" onClick={handleSend}>
              <SendIcon />
            </IconButton>
          </motion.div>
        </Box>
      </Container>
    </motion.div>
  )
}

export default App