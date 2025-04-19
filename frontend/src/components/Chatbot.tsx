import React, { useEffect, useRef, useState } from 'react';
import { Button, TextField, Box, Paper, Typography, CircularProgress, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import { useChat } from '../context/ChatContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Chatbot: React.FC = () => {
  const { state, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !state.isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ 
        p: 2, 
        backgroundColor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">Security Assistant</Typography>
        <IconButton 
          color="inherit" 
          onClick={clearChat} 
          title="Clear chat history"
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ 
        p: 2, 
        flexGrow: 1, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: '#f5f5f5',
        maxHeight: '60vh'
      }}>
        {state.messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary'
          }}>
            <Typography variant="body2">
              Ask the security assistant about malicious requests, security best practices, or specific attack vectors.
            </Typography>
          </Box>
        ) : (
          state.messages.map((msg) => (
            <Paper 
              key={msg.id} 
              elevation={1}
              sx={{ 
                p: 2, 
                maxWidth: '80%', 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                bgcolor: msg.role === 'user' ? 'primary.light' : 'white',
                color: msg.role === 'user' ? 'white' : 'text.primary',
                borderRadius: 2,
                wordBreak: 'break-word'
              }}
            >
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <SyntaxHighlighter
                        // Fix the style prop type issue
                        style={materialDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </Paper>
          ))
        )}
        
        {state.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {state.error && (
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              bgcolor: '#ffebee', 
              color: 'error.main',
              alignSelf: 'center'
            }}
          >
            <Typography variant="body2">Error: {state.error}</Typography>
          </Paper>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, bgcolor: 'background.paper', display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask a security question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={state.isLoading}
          sx={{ mr: 1 }}
          size="small"
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={state.isLoading || !input.trim()} 
          endIcon={<SendIcon />}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default Chatbot;