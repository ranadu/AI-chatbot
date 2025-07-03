import { useState } from 'react';

function App() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');

  const sendMessage = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: 'demo-user',  // can be dynamic later
          message,
        }),
      });

      const data = await response.json();
      setReply(data.response || 'No response from backend');
    } catch (error) {
      console.error('Error sending message:', error);
      setReply('Error contacting the server');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AI Chatbot</h1>
      <input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: '300px', padding: '0.5rem', marginRight: '1rem' }}
      />
      <button onClick={sendMessage} style={{ padding: '0.5rem 1rem' }}>
        Send
      </button>

      <div style={{ marginTop: '2rem' }}>
        <strong>Bot:</strong> <span>{reply}</span>
      </div>
    </div>
  );
}

export default App;