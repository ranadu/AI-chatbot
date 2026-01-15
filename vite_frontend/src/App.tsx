// src/App.tsx
import { useState, useRef, useEffect } from "react"
import axios from "axios"
import "./App.css"

type Message = {
  type: "user" | "bot"
  content: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", content: "👋 Hello! How can I help you today?" },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { type: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await axios.post("https://ai-chatbot-8g4u.onrender.com/chat", {
        user: "robert",
        message: input,
      })

      const botMessage: Message = {
        type: "bot",
        content: res.data.response || "No response",
      }

      setMessages((prev) => [...prev, botMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Sorry, something went wrong." },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="app-container">
      <div className="chat-window">
        <header className="chat-header">
          🤖 <span className="chat-title">AI Chatbot Assistant</span>
        </header>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.type === "user" ? "user-bubble" : "bot-bubble"}`}
            >
              {msg.content}
            </div>
          ))}
          {loading && <div className="bot-bubble">Typing...</div>}
          <div ref={endRef} />
        </div>

        <div className="chat-input-area">
          <input
            className="chat-input"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <button className="send-button" onClick={handleSend} disabled={loading}>
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}

export default App