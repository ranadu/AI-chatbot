# 🤖 AI Chatbot Assistant

A beautiful, full-stack AI chatbot web app built with **FastAPI**, **React + TypeScript**, and **GROQ LLM API**, featuring real-time chat, persistent memory, and a sleek Apple-style UI. Designed for both aesthetics and functionality.

---

## ✨ Features

- 🔮 **GROQ LLM Integration** – Uses open-source GPT-style model via GROQ API
- 🧠 **Persistent Memory** – Remembers past messages using SQLite backend
- 🎨 **Beautiful UI** – Apple-inspired gradients, rounded corners, subtle animations
- ⚡ **FastAPI Backend** – Lightweight, async, RESTful chat endpoint
- 💬 **Typing Animation** – Smooth UI with “Typing…” feedback
- 📱 **Responsive Design** – Optimized for desktop and mobile screens
- ☁️ **Fully Deployed** – Backend on Render, Frontend on Vercel

---

## 🧠 System Overview
User ↔ Frontend (React + Vite + TS) ↔ FastAPI Backend ↔ GROQ LLM
↕
SQLite DB (memory)

---

## 📸 Preview

![Chat UI](https://user-images.githubusercontent.com/your-demo-image.png)  
*Apple-like minimalist interface with beautiful gradients and clean layout*

---

## 🚀 Tech Stack

| Layer        | Tech                        |
|--------------|-----------------------------|
| Frontend     | React, TypeScript, Vite     |
| Styling      | CSS (custom), MUI Icons     |
| Animation    | Framer Motion               |
| Backend      | FastAPI                     |
| Database     | SQLite (via custom module)  |
| LLM API      | GROQ (gpt-oss-120b)         |
| Deployment   | Vercel (frontend), Render (backend) |

---
MIT License © 2026 Robert Anadu
Built for portfolio and educational purposes.
