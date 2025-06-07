import axios from 'axios';
import { ChatMessage } from '../types';

const API_URL = 'http://localhost:5000/api/chatbot';

// Enhanced interface for sending messages with context
interface SendMessageOptions {
  messages: Omit<ChatMessage, 'id' | 'timestamp'>[];
  ipContext?: string;
  attackId?: string;
  includeSystemLogs?: boolean;
}

// Send a message to the chatbot and get a response with optional context
export const sendMessage = async ({ 
  messages, 
  ipContext, 
  attackId, 
  includeSystemLogs 
}: SendMessageOptions) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    `${API_URL}/message`, 
    { 
      messages,
      ipContext,
      attackId,
      includeSystemLogs
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data.response;
};

// Get detailed attack information for chatbot analysis
export const getAttackDetails = async (attackId: string) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(
    `${API_URL}/attack/${attackId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Get security system overview for chatbot context
export const getSecurityOverview = async () => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(
    `${API_URL}/overview`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
};