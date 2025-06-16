import React, { useEffect, useRef, useState } from 'react';
import { 
  Button, 
  TextField, 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { useChat } from '../context/ChatContext';
import ReactMarkdown from 'react-markdown';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

interface ChatbotProps {
  ipContext?: string;
  attackId?: string;
  onContextChange?: (hasContext: boolean) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ ipContext, attackId, onContextChange }) => {
  const { state, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const [includeSystemLogs, setIncludeSystemLogs] = useState(false);
  const [enhancedMode, setEnhancedMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Notify parent about context availability
  useEffect(() => {
    const hasContext = !!(ipContext || attackId || enhancedMode);
    onContextChange?.(hasContext);
  }, [ipContext, attackId, enhancedMode, onContextChange]);
  
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
      // Send message with enhanced context
      sendMessage(input, {
        ipContext: enhancedMode ? ipContext : undefined,
        attackId: enhancedMode ? attackId : undefined,
        includeSystemLogs: enhancedMode ? includeSystemLogs : false
      });
      setInput('');
    }
  };

  const getContextIndicators = () => {
    const indicators = [];
    
    if (enhancedMode && ipContext) {
      indicators.push(
        <Tooltip key="ip" title={`Monitoring data for ${ipContext}`}>
          <Chip 
            icon={<MonitorHeartIcon />}
            label={`IP: ${ipContext}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Tooltip>
      );
    }
    
    if (enhancedMode && attackId) {
      indicators.push(
        <Tooltip key="attack" title={`Attack analysis context: ${attackId}`}>
          <Chip 
            icon={<SecurityIcon />}
            label="Attack Context"
            size="small"
            color="error"
            variant="outlined"
          />
        </Tooltip>
      );
    }
    
    if (enhancedMode && includeSystemLogs) {
      indicators.push(
        <Tooltip key="logs" title="Including system logs and capture files">
          <Chip 
            label="System Logs"
            size="small"
            color="warning"
            variant="outlined"
          />
        </Tooltip>
      );
    }
    
    return indicators;
  };

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0, overflow: 'hidden' }}>      <Box sx={{ 
        p: 2, 
        backgroundColor: 'background.paper', 
        borderBottom: '1px solid',
        borderColor: 'primary.main',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography color="primary.main" variant="h6">Security Assistant</Typography>
          {enhancedMode && (
            <Typography color="text.secondary" variant="caption" sx={{ opacity: 0.8 }}>
              Enhanced with monitoring data & attack analysis
            </Typography>
          )}
        </Box>
        <IconButton 
          sx={{ color: 'primary.main' }}
          onClick={clearChat} 
          title="Clear chat history"
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      </Box>      {/* Context indicators */}
      {enhancedMode && getContextIndicators().length > 0 && (
        <Box sx={{ 
          p: 1, 
          backgroundColor: 'rgba(240, 231, 180, 0.1)', 
          borderBottom: '1px solid rgba(240, 231, 180, 0.2)',
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap' 
        }}>
          <Typography color="text.primary" variant="caption" sx={{ alignSelf: 'center', mr: 1 }}>
            Active Context:
          </Typography>
          {getContextIndicators()}
        </Box>
      )}      {/* Settings */}
      <Box sx={{ 
        p: 1, 
        borderBottom: '1px solid rgba(240, 231, 180, 0.2)', 
        backgroundColor: 'rgba(240, 231, 180, 0.05)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', marginLeft: '1%' }}>
          <FormControlLabel
            control={
              <Switch 
                checked={enhancedMode}
                onChange={(e) => setEnhancedMode(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'primary.main',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'primary.main',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" color="text.primary">
                Enhanced Mode
              </Typography>
            }
          />
          {enhancedMode && (
            <FormControlLabel
              control={
                <Switch 
                  checked={includeSystemLogs}
                  onChange={(e) => setIncludeSystemLogs(e.target.checked)}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'primary.main',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'primary.main',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" color="text.primary">
                  Include System Logs
                </Typography>
              }
            />
          )}
        </Box>
      </Box>
        <Box sx={{ 
        p: 2, 
        flexGrow: 1, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: 'background.default',
        maxHeight: '60vh'
      }}>
        {state.messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary',
            textAlign: 'center'
          }}>            <Box>
              <Typography color="text.primary" variant="body2" gutterBottom>
                {enhancedMode 
                  ? "Ask about attacks, monitoring data, security incidents, or get detailed threat analysis."
                  : "Ask the security assistant about cybersecurity best practices and general security questions."
                }
              </Typography>
              {enhancedMode && (ipContext || attackId) && (
                <Typography variant="caption" color="text.secondary">
                  ✓ Context-aware analysis enabled
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          state.messages.map((msg) => (              <Paper 
              key={msg.id} 
              elevation={1}
              sx={{ 
                p: 1,
                width: 'auto',
                maxWidth: '30%', 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                color: msg.role === 'user' ? 'background.default' : 'text.primary',
                borderRadius: 1.5,
                wordBreak: 'break-word',
                border: '1px solid',
                borderColor: msg.role === 'user' ? 'primary.main' : 'rgba(240, 231, 180, 0.3)',
                fontSize: '0.9rem',
                lineHeight: 1.3,
                '& p': {
                  margin: '0.2rem 0',
                  lineHeight: 1.3
                },
                '& p:first-of-type': {
                  marginTop: 0
                },
                '& p:last-of-type': {
                  marginBottom: 0
                }
              }}
            >
              <ReactMarkdown
                components={{
                  code({ className, children }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <SyntaxHighlighter
                        style={materialDark}
                        language={match[1]}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: 'flex-start'}}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              {enhancedMode ? "Analyzing security data..." : "Thinking..."}
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ 
        p: 2, 
        backgroundColor: 'background.paper',
        borderTop: '1px solid rgba(240, 231, 180, 0.2)'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={enhancedMode 
              ? "Ask about attacks, monitoring, threats..." 
              : "Ask a security question..."
            }
            disabled={state.isLoading}
            size="small"
            multiline
            maxRows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(240, 231, 180, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiInputBase-input': {
                color: 'text.primary',
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'text.secondary',
                opacity: 0.7,
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!input.trim() || state.isLoading}
            sx={{ 
              minWidth: 'auto', 
              px: 2,
              backgroundColor: 'primary.main',
              color: 'background.default',
              '&:hover': {
                backgroundColor: 'primary.main',
                filter: 'brightness(0.9)',
              },
            }}
          >
            <SendIcon />
          </Button>
        </Box>
        
        {state.error && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {state.error}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default Chatbot;