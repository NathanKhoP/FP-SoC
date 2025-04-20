import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert,
  Container,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { state, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to /monitor
  const from = location.state?.from?.pathname || '/monitor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      // Redirect after successful login
      navigate(from, { replace: true });
    } catch (error) {
      // Error handling already done in context
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Login to IP Monitoring System
        </Typography>
        
        {state.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {state.error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state.isLoading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={state.isLoading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={state.isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {state.isLoading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Don't have an account?
            </Typography>
            <Button 
              variant="outlined" 
              component={Link} 
              to="/register"
              fullWidth
            >
              Register Now
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginForm;