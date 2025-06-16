import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import IpMonitor from '../components/IpMonitor';

const MonitorPage: React.FC = () => (
  <Container maxWidth="lg">
    <Typography variant="h4" gutterBottom>
      IP Address Monitoring
    </Typography>
    <Typography variant="body1" color="text.secondary" paragraph>
      Monitor IP addresses for suspicious activity and security threats.
    </Typography>
    <Box sx={{ mt: 3 }}>
      <IpMonitor />
    </Box>
  </Container>
);

export default MonitorPage;
