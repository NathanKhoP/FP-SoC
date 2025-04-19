import axios from 'axios';
import { ChatMessage } from '../types';

const API_URL = 'http://localhost:5000/api/chatbot';

// Send a message to the chatbot and get a response
export const sendMessage = async (messages: Omit<ChatMessage, 'id' | 'timestamp'>[]) => {
  const response = await axios.post(`${API_URL}/message`, { messages });
  return response.data.response;
};