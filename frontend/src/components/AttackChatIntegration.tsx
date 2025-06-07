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
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SecurityIcon from '@mui/icons-material/Security';
import Chatbot from './Chatbot';
import { getAttackDetails } from '../services/chatbotService';

interface AttackChatIntegrationProps {
  attackId?: string;
  attackSummary?: {
    sourceIp: string;
    type: string;
    severity: string;
    url: string;
  };
}

const AttackChatIntegration: React.FC<AttackChatIntegrationProps> = ({
  attackId,
  attackSummary
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [attackDetails, setAttackDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChat = async () => {
    if (attackId && !attackDetails) {
      setLoading(true);
      try {
        const details = await getAttackDetails(attackId);
        setAttackDetails(details);
      } catch (err) {
        setError('Failed to load attack details for analysis');
      } finally {
        setLoading(false);
      }
    }
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'sql_injection':
      case 'xss':
      case 'csrf':
        return <BugReportIcon />;
      case 'ddos':
      case 'brute_force':
        return <SecurityIcon />;
      default:
        return <AnalyticsIcon />;
    }
  };

  if (!attackId && !attackSummary) {
    return null;
  }

  return (
    <Box>
      {/* Attack Analysis Integration Panel */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2, 
          background: `linear-gradient(135deg, ${
            attackSummary?.severity === 'critical' ? '#ff5722' :
            attackSummary?.severity === 'high' ? '#f44336' :
            attackSummary?.severity === 'medium' ? '#ff9800' : '#2196f3'
          } 0%, #673ab7 100%)`,
          color: 'white'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getTypeIcon(attackSummary?.type || '')}
              <Typography variant="h6">
                Attack Analysis Assistant
              </Typography>
              {attackSummary?.severity && (
                <Chip 
                  label={attackSummary.severity.toUpperCase()}
                  size="small"
                  color={getSeverityColor(attackSummary.severity)}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              )}
            </Box>
            
            {attackSummary && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  <strong>Source:</strong> {attackSummary.sourceIp} | 
                  <strong> Type:</strong> {attackSummary.type?.replace('_', ' ')} | 
                  <strong> Target:</strong> {attackSummary.url}
                </Typography>
              </Box>
            )}
            
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Get comprehensive AI analysis of this attack, related patterns, and detailed mitigation strategies
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="contained"
              onClick={handleOpenChat}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ChatIcon />}
              disabled={loading}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)'
                },
                mb: 1
              }}
            >
              {loading ? 'Loading...' : 'Analyze Attack'}
            </Button>
          </Grid>
        </Grid>

        {/* Quick Analysis Suggestions */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ width: '100%', opacity: 0.8 }}>
            Quick Analysis Options:
          </Typography>
          <Chip
            label="Attack vector analysis"
            size="small"
            clickable
            onClick={handleOpenChat}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          />
          <Chip
            label="Related attacks from this IP"
            size="small"
            clickable
            onClick={handleOpenChat}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          />
          <Chip
            label="Mitigation strategies"
            size="small"
            clickable
            onClick={handleOpenChat}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          />
          <Chip
            label="Threat intelligence"
            size="small"
            clickable
            onClick={handleOpenChat}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
          />
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Context Information */}
      {attackDetails && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Enhanced Context Available:</strong> Attack details, {attackDetails.relatedAttacks?.length || 0} related attacks, 
            {attackDetails.monitoringData?.length || 0} monitoring records, and 
            {attackDetails.isCurrentlyMonitored ? 'active monitoring' : 'historical data'} for {attackSummary?.sourceIp}
          </Typography>
        </Alert>
      )}

      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={handleCloseChat}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '85vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: getSeverityColor(attackSummary?.severity || 'info') === 'error' ? 'error.main' : 'primary.main',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReportIcon />
            <Typography variant="h6">Attack Analysis Assistant</Typography>
            {attackSummary && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={attackSummary.type?.replace('_', ' ')} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  label={attackSummary.severity} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            )}
          </Box>
          <IconButton onClick={handleCloseChat} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <Chatbot
            attackId={attackId}
            ipContext={attackSummary?.sourceIp}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AttackChatIntegration;
