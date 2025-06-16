import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import LoginForm from '../components/LoginForm';

const LoginPage: React.FC = () => (
  <Container maxWidth="sm">
    <Box sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login to Your Account
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Access your security dashboard and monitoring tools
        </Typography>
        <LoginForm />
      </Paper>
    </Box>
  </Container>
);

export default LoginPage;
