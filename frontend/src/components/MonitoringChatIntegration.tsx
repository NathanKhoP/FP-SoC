import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SecurityIcon from '@mui/icons-material/Security';
import Chatbot from './Chatbot';

interface MonitoringChatIntegrationProps {
  monitoredIps: string[];
  selectedIp?: string;
  scanResult?: any;
  hasRecentLogs?: boolean;
}

const MonitoringChatIntegration: React.FC<MonitoringChatIntegrationProps> = ({
  monitoredIps,
  selectedIp,
  scanResult,
  hasRecentLogs
}) => {
  const [chatOpen, setChatOpen] = useState(false);

  const handleOpenChat = () => {
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
  };

  const getContextSummary = () => {
    const contexts = [];
    
    if (selectedIp) {
      contexts.push(`Analyzing ${selectedIp}`);
    }
    
    if (scanResult?.suspiciousActivity) {
      contexts.push('Suspicious activity detected');
    }
    
    if (hasRecentLogs) {
      contexts.push('Recent monitoring logs available');
    }
    
    return contexts;
  };

  const getSeverityColor = () => {
    if (scanResult?.suspiciousActivity) {
      return 'error';
    }
    if (scanResult && scanResult.anomalies?.length > 0) {
      return 'warning';
    }
    return 'info';
  };

  return (
    <Box>
      {/* Quick Action Buttons */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              Security Assistant Integration
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Ask the AI assistant about monitored IPs, scan results, and security analysis
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            onClick={handleOpenChat}
            startIcon={<ChatIcon />}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            Open Security Assistant
          </Button>
        </Box>

        {/* Context Indicators */}
        {getContextSummary().length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ alignSelf: 'center', opacity: 0.8 }}>
              Available Context:
            </Typography>
            {getContextSummary().map((context, index) => (
              <Chip
                key={index}
                label={context}
                size="small"
                color={getSeverityColor()}
                variant="outlined"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)'
                }}
              />
            ))}
          </Box>
        )}

        {/* Quick suggestions */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ width: '100%', opacity: 0.8 }}>
            Quick Actions:
          </Typography>
          {selectedIp && (
            <Chip
              label={`Analyze ${selectedIp} security`}
              size="small"
              clickable
              onClick={handleOpenChat}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
            />
          )}
          {scanResult?.suspiciousActivity && (
            <Chip
              label="Explain suspicious activity"
              size="small"
              clickable
              onClick={handleOpenChat}
              color="error"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            />
          )}
          <Chip
            label="Security recommendations"
            size="small"
            clickable
            onClick={handleOpenChat}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          />
        </Box>
      </Paper>

      {/* Monitoring Insights */}
      {monitoredIps.length > 0 && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={handleOpenChat}>
              Ask AI
            </Button>
          }
        >
          <Typography variant="body2">
            {monitoredIps.length} IP{monitoredIps.length > 1 ? 's' : ''} currently monitored. 
            The AI assistant has access to all monitoring data and can provide insights.
          </Typography>
        </Alert>
      )}

      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={handleCloseChat}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1  }}>
            <SecurityIcon htmlColor="#242424"/>
            <Typography color="#242424" variant="h6">Security Assistant</Typography>
            {selectedIp && (
              <Chip 
                label={`Analyzing ${selectedIp}`} 
                size="small" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            )}
          </Box>
          <IconButton onClick={handleCloseChat} sx={{ color: 'black' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <Chatbot
            ipContext={selectedIp}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MonitoringChatIntegration;
