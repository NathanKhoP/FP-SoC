import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

// Layout component
import AppLayout from './components/Layout';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#f0e7b4',
    },
    secondary: {
      main: '#f0e7b4',
    },
    text: {
      primary: '#f0e7b4',
      secondary: '#f0e7b4',
    },
    background: {
      default: '#2B2C2C',
      paper: '#2B2C2C',
    },
    mode: 'dark',
  },
  typography: {
    fontFamily: '"Pixelify Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Main App component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ChatProvider>
          <Router>
            <AppLayout />
          </Router>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
