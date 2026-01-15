import { useState } from "react"
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
    { type: "bot", content: "Hello! How can I help you today?" },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const newMessages: Message[] = [
      ...messages,
      { type: "user", content: input },
    ]
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

      const botMessage =
        response.data.response || "Sorry, I couldn't generate a reply."

      const newBotMsg: Message = { type: "bot", content: botMessage }

      setMessages([...newMessages, newBotMsg])
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          type: "bot",
          content:
            "Something went wrong while connecting to the server. Please try again.",
        },
      ])
    } finally {
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
          AI Chatbot Assistant
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
                      msg.type === "user" ? "#1976d2" : "#eee",
                    color: msg.type === "user" ? "white" : "black",
                    boxShadow: 1,
                  }}
                >
                  {msg.content}
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

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend} disabled={loading}>
            <SendIcon />
          </IconButton>
        </Box>
      </Container>
    </Box>
  )
}

export default App