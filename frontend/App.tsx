import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { VITE_API_BASE_URL } from '@env';

export default function App() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${VITE_API_BASE_URL}/chat`, {
        user: 'robert',
        message: userMessage.text,
      });

      const botMessage = { sender: 'bot', text: res.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errMessage = {
        sender: 'bot',
        text: "Wahala o! I couldn't reach the brain right now. Try again later.",
      };
      setMessages((prev) => [...prev, errMessage]);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 80 }}>
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? '#DCF8C6' : '#EEE',
                borderRadius: 10,
                padding: 10,
                marginBottom: 10,
                maxWidth: '80%',
              }}
            >
              <Text>{msg.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            padding: 10,
            borderTopWidth: 1,
            borderColor: '#ccc',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
          }}
        >
          <TextInput
            style={{
              flex: 1,
              height: 40,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              paddingHorizontal: 10,
            }}
            value={input}
            onChangeText={setInput}
            placeholder="Type something... 🇳🇬"
            onSubmitEditing={sendMessage}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={loading}
            style={{
              marginLeft: 8,
              backgroundColor: '#007AFF',
              paddingHorizontal: 16,
              borderRadius: 8,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}