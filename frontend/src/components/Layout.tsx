import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, IconButton, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import MonitorIcon from '@mui/icons-material/ScreenSearchDesktop';
import ChatIcon from '@mui/icons-material/Chat';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

// Context
import { useAuth } from '../context/AuthContext';

// Pages
import { HomePage, DashboardPage, MonitorPage, ChatbotPage, LoginPage, RegisterPage } from '../pages';

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
            ARMOR
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
            <ListItem button component="a" href="/" onClick={handleDrawerToggle}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button component="a" href="/monitor" onClick={handleDrawerToggle}>
              <ListItemIcon><MonitorIcon /></ListItemIcon>
              <ListItemText primary="IP Monitoring" />
            </ListItem>
            <ListItem button component="a" href="/chatbot" onClick={handleDrawerToggle}>
              <ListItemIcon><ChatIcon /></ListItemIcon>
              <ListItemText primary="Security Assistant" />
            </ListItem>
          </List>
          <Divider />
          <List>
            {state.isAuthenticated && (
              <ListItem button component="a" href="/dashboard" onClick={handleDrawerToggle}>
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
            <Route path="/" element={<HomePage />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Main>
    </Box>
  );
};

export default Layout;
