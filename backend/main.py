import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
from backend.memory.memory_store import init_db, save_interaction, get_past_interactions

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

class ChatRequest(BaseModel):
    user: str
    message: str

@app.post("/chat")
async def chat(req: ChatRequest):
    memory = get_past_interactions(req.user, limit=5)
    messages = [
        {"role": "system", "content": "You are a helpful, friendly assistant. Be clear, concise, and supportive."},
        {"role": "user", "content": "\n".join(memory + [f"User: {req.message}", "Bot:"])}
    ]

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
    "model": "openai/gpt-oss-120b",
    "messages": messages
    }

    response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data)
    
    if response.status_code != 200:
        return {"error": response.text}

    reply = response.json()["choices"][0]["message"]["content"].strip()
    save_interaction(req.user, req.message, reply)
    return {"response": reply}