import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Grid, AppBar, Toolbar, Typography, Container, Button, IconButton, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import MonitorIcon from '@mui/icons-material/ScreenSearchDesktop';
import ChatIcon from '@mui/icons-material/Chat';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

// Context providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

// Components
import Chatbot from './components/Chatbot';
import IpMonitor from './components/IpMonitor';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import mascotGif from './assets/mascot.gif';
import boxBg from './assets/Box.png';

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

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: `${drawerWidth}px`,
  }),
}));

// Home/landing page component
const Home: React.FC = () => {
  return (
    <Container maxWidth={false}>
      <Box sx={{ 
        backgroundImage: `url(${boxBg})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        padding: '32px',
        margin: '0 40px',
        minHeight: '800px',  // Adjust based on your Box.png dimensions
      }}>
        <Grid container spacing={4} alignItems="center" >
          <Grid item xs={12} md={5.5} sx={{ml: '100px'}}>
            <Typography variant="h2" component="h1" gutterBottom>
              IP Monitoring System
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              With AI-powered cybersecurity assistant
            </Typography>
            <Typography paragraph fontSize={24}>
              This system enables security teams to monitor IP addresses for suspicious activity.
              Our AI-powered assistant helps analyze threats and provides recommendations for mitigation.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="contained" size="large" component="a" href="/monitor">
                Monitor IP Addresses
              </Button>
              <Button variant="outlined" size="large" component="a" href="/chatbot">
                Ask Security Assistant
              </Button>
            </Box>
          </Grid>
          <Grid item xs={8} md={5}>
            <Box
              sx={{
                position: 'relative',
                ml: '230px',
              }}
            >
              <Box
                className="mascot-background"
              />
              <Box 
                component="img"
                src={mascotGif}
                alt="Security Mascot"
                className="mascot-image"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Feature highlights */}
        <Box sx={{ mx: 12 }}>
          <Typography variant="h3" gutterBottom>
            Key Features
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3}}>
            <Box sx={{ flex: '1 1 300px', p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
              <Typography variant="h6">Automated IP Monitoring</Typography>
              <Typography>
                Continuous monitoring of IP addresses with port scanning, traffic analysis, and suspicious activity detection.
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 300px', p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
              <Typography variant="h6">AI-Powered Analysis</Typography>
              <Typography>
                Advanced Groq LLM integration automatically analyzes detected threats and provides actionable insights.
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 300px', p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
              <Typography variant="h6">Security Expert Chatbot</Typography>
              <Typography>
                Get immediate assistance from our AI security assistant with access to monitoring logs.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

// Dashboard page placeholder
const Dashboard: React.FC = () => (
  <Container maxWidth="lg">
    <Typography variant="h4" gutterBottom>Dashboard</Typography>
    <Typography>Security incidents overview and analytics will appear here.</Typography>
  </Container>
);

// Monitor page (replacing Report page)
const MonitorPage: React.FC = () => (
  <Container maxWidth="lg">
    <Typography variant="h4" gutterBottom>IP Address Monitoring</Typography>
    <Box sx={{ mt: 3 }}>
      <IpMonitor />
    </Box>
  </Container>
);

// Chatbot page
const ChatbotPage: React.FC = () => (
  <Container maxWidth="lg">
    <Typography variant="h4" gutterBottom>Security Assistant</Typography>
    <Box sx={{ mt: 3, height: '70vh' }}>
      <Chatbot />
    </Box>
  </Container>
);

// Login page placeholder
const Login: React.FC = () => (
  <LoginForm />
);

// Protected route component
const ProtectedRoute: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { state } = useAuth();
  const location = useLocation();
  
  if (state.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return state.isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

// Main layout with navigation
const Layout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { state, logout } = useAuth();
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            IP Monitoring System
          </Typography>
          {state.isAuthenticated ? (
            <Button color="inherit" onClick={logout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </Button>
          ) : (
            <>
              <Button color="inherit" href="/login" sx={{ mr: 1 }}>
                <LoginIcon sx={{ mr: 1 }} />
                Login
              </Button>
              <Button color="inherit" href="/register" variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            <ListItem button component="a" href="/">
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button component="a" href="/monitor">
              <ListItemIcon><MonitorIcon /></ListItemIcon>
              <ListItemText primary="IP Monitoring" />
            </ListItem>
            <ListItem button component="a" href="/chatbot">
              <ListItemIcon><ChatIcon /></ListItemIcon>
              <ListItemText primary="Security Assistant" />
            </ListItem>
          </List>
          <Divider />
          <List>
            {state.isAuthenticated && (
              <ListItem button component="a" href="/dashboard">
                <ListItemIcon><SecurityIcon /></ListItemIcon>
                <ListItemText primary="Security Dashboard" />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
      
      <Main open={drawerOpen}>
        <Toolbar /> {/* This empty Toolbar is for spacing below the AppBar */}
        <Box sx={{ py: 3 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Main>
    </Box>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <ChatProvider>
          <Router>
            <Layout />
          </Router>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
