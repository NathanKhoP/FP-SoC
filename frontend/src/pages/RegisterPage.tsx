import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import RegisterForm from '../components/RegisterForm';

const RegisterPage: React.FC = () => (
  <Container maxWidth="sm">
    <Box sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create Your Account
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph align="center">
          Join our security monitoring platform
        </Typography>
        <RegisterForm />
      </Paper>
    </Box>
  </Container>
);

export default RegisterPage;
