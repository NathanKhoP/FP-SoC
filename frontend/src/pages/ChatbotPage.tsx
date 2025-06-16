import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import Chatbot from '../components/Chatbot';

const ChatbotPage: React.FC = () => (
  <Container maxWidth="lg">
    <Typography variant="h4" gutterBottom>
      Security Assistant
    </Typography>
    <Typography variant="body1" color="text.secondary" paragraph>
      Ask our AI-powered security assistant for help with threat analysis and recommendations.
    </Typography>
    <Box sx={{ mt: 3, height: '70vh' }}>
      <Chatbot />
    </Box>
  </Container>
);

export default ChatbotPage;
