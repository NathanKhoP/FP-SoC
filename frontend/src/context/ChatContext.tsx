import React, { createContext, useContext, useReducer } from 'react';
import { ChatMessage, ChatState } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as chatbotService from '../services/chatbotService';

// Initial state for chat
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

// Action types for chat
type ChatAction =
  | { type: 'SEND_MESSAGE'; payload: { message: string } }
  | { type: 'RECEIVE_MESSAGE'; payload: { message: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_CHAT' };

// Reducer for chat state
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SEND_MESSAGE':
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: action.payload.message,
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        messages: [...state.messages, userMessage],
      };
    case 'RECEIVE_MESSAGE':
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: action.payload.message,
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_CHAT':
      return {
        ...initialState,
      };
    default:
      return state;
  }
};

// Create the chat context
interface ChatContextProps {
  state: ChatState;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

// Create the Chat Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Send message to chatbot and get response
  const sendMessage = async (message: string) => {
    try {
      // Update state with user message
      dispatch({ type: 'SEND_MESSAGE', payload: { message } });
      
      // Set loading state
      dispatch({ type: 'SET_LOADING', payload: true });

      // Format messages for API
      const messageHistory = state.messages.map(({ role, content }) => ({
        role,
        content,
      }));

      // Add current message to history
      messageHistory.push({
        role: 'user',
        content: message,
      });

      // Send message to API
      const response = await chatbotService.sendMessage(messageHistory);

      // Update state with assistant response
      dispatch({ type: 'RECEIVE_MESSAGE', payload: { message: response } });
    } catch (err) {
      let errorMessage = 'Failed to send message';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Clear chat history
  const clearChat = () => {
    dispatch({ type: 'CLEAR_CHAT' });
  };

  return (
    <ChatContext.Provider value={{ state, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
};

// Create a custom hook for using the chat context
export const useChat = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};