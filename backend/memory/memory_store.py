import sqlite3
from typing import List

DB_PATH = "chat_memory.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            message TEXT NOT NULL,
            response TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def save_interaction(user: str, message: str, response: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO memory (user, message, response) VALUES (?, ?, ?)',
                   (user, message, response))
    conn.commit()
    conn.close()

def get_past_interactions(user: str, limit: int = 5) -> List[str]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT message, response FROM memory WHERE user = ? ORDER BY id DESC LIMIT ?',
                   (user, limit))
    rows = cursor.fetchall()
    conn.close()
    return [f"User: {m}\nBot: {r}" for m, r in reversed(rows)]