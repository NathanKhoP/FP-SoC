import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { startMonitoring, stopMonitoring, getMonitoredIps, scanIp, getMonitoringLogs } from '../services/monitoringService';
import MonitoringChatIntegration from './MonitoringChatIntegration';
import { SeverityLevel } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface ScanResult {
  timestamp: Date;
  targetIp: string;
  trafficStats: {
    packetsPerSecond: number;
    bytesPerSecond: number;
    uniqueSources: string[]; // Array from backend
    protocols: Record<string, number>; // Object from backend
    connectionAttempts: number;
  };
  suspiciousActivity: boolean;
  anomalies: string[];
}

const IpMonitor: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [interval, setInterval] = useState(5);
  const [monitoredIps, setMonitoredIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [monitoringLogs, setMonitoringLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Validation for IP addresses
  const isValidIp = (ip: string): boolean => {
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipPattern.test(ip);
  };

  // Fetch currently monitored IPs on component mount
  useEffect(() => {
    loadMonitoredIps();
  }, []);

  // Load monitored IPs from the server
  const loadMonitoredIps = async () => {
    try {
      setLoading(true);
      const ips = await getMonitoredIps();
      setMonitoredIps(ips);
      setLoading(false);
    } catch (err) {
      setError('Failed to load monitored IPs');
      setLoading(false);
    }
  };

  // Start monitoring an IP address
  const handleStartMonitoring = async () => {
    if (!ipAddress) {
      setError('Please enter an IP address');
      return;
    }

    if (!isValidIp(ipAddress)) {
      setError('Please enter a valid IP address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await startMonitoring(ipAddress, interval);
      setSuccess(`Started monitoring ${ipAddress}`);
      setIpAddress('');
      loadMonitoredIps();
    } catch (err) {
      setError('Failed to start monitoring');
    } finally {
      setLoading(false);
    }
  };

  // Stop monitoring an IP address
  const handleStopMonitoring = async (ip: string) => {
    try {
      setLoading(true);
      await stopMonitoring(ip);
      setSuccess(`Stopped monitoring ${ip}`);
      loadMonitoredIps();
    } catch (err) {
      setError(`Failed to stop monitoring ${ip}`);
    } finally {
      setLoading(false);
    }
  };

  // Run a one-time scan on an IP address
  const handleScanIp = async (ip: string) => {
    try {
      setScanLoading(true);
      setScanResult(null);
      const result = await scanIp(ip);
      setScanResult(result);
      setScanLoading(false);
    } catch (err) {
      setError(`Failed to scan ${ip}`);
      setScanLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Load monitoring logs for a specific IP
  const handleViewLogs = async (ip: string) => {
    setSelectedIp(ip);
    try {
      setLogsLoading(true);
      setError(null);
      console.log(`Loading logs for IP: ${ip}`);
      const response = await getMonitoringLogs(ip);
      console.log('Logs response:', response);
      console.log('Number of logs received:', response.logs?.length || 0);
      if (response.logs?.length > 0) {
        console.log('First log sample:', response.logs[0]);
      }
      setMonitoringLogs(response.logs);
      setSuccess(`Loaded ${response.logs?.length || 0} logs for ${ip}`);
      setLogsLoading(false);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(`Failed to load logs for ${ip}`);
      setLogsLoading(false);
      setSuccess(null);
    }
  };

  // Get severity color for visual indication
  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        IP Address Monitoring
      </Typography>

      {/* AI Assistant Integration */}
      <MonitoringChatIntegration
        monitoredIps={monitoredIps}
        selectedIp={selectedIp}
        scanResult={scanResult}
        hasRecentLogs={monitoringLogs.length > 0}
      />

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="IP monitoring tabs">
        <Tab label="Configure Monitoring" />
        <Tab label="Active Monitors" />
        <Tab label="Monitoring Logs" />
      </Tabs>

      {/* Tab 1: Configure monitoring */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mt: 3, mb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="ipAddress"
                label="IP Address to Monitor"
                placeholder="192.168.1.1"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                error={ipAddress !== '' && !isValidIp(ipAddress)}
                helperText={ipAddress !== '' && !isValidIp(ipAddress) ? 'Please enter a valid IP address' : ''}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                id="interval"
                label="Check Interval (minutes)"
                type="number"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value))}
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                disabled={loading || !ipAddress}
                onClick={handleStartMonitoring}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Start Monitoring'}
              </Button>
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Note: The first time an IP is monitored, an initial 5-minute baseline scan is performed. Subsequent checks occur at the specified interval.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            One-Time IP Scan
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                id="scanIpAddress"
                label="IP Address to Scan"
                placeholder="192.168.1.1"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                error={ipAddress !== '' && !isValidIp(ipAddress)}
                helperText={ipAddress !== '' && !isValidIp(ipAddress) ? 'Please enter a valid IP address' : ''}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                disabled={scanLoading || !ipAddress}
                onClick={() => handleScanIp(ipAddress)}
                fullWidth
              >
                {scanLoading ? <CircularProgress size={24} /> : 'Run Scan'}
              </Button>
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Note: A standard scan takes approximately 1 minute. If this is the first scan for this IP, an initial 5-minute baseline scan will run first.
          </Typography>

          {scanResult && (
            <Paper elevation={2} sx={{ mt: 2, p: 2 }}>
              <Typography variant="h6">
                Scan Results for {scanResult.targetIp}
                {scanResult.suspiciousActivity && (
                  <Chip 
                    label="Suspicious Activity Detected" 
                    color="error" 
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scanned at: {new Date(scanResult.timestamp).toLocaleString()}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Traffic Statistics</Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography>Packets/Second: {scanResult.trafficStats.packetsPerSecond.toFixed(2)}</Typography>
                    <Typography>Data Rate: {(scanResult.trafficStats.bytesPerSecond / 1024).toFixed(2)} KB/s</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Network Activity</Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography>Unique Sources: {scanResult.trafficStats.uniqueSources.length}</Typography>
                    <Typography>Connection Attempts: {scanResult.trafficStats.connectionAttempts}</Typography>
                  </Box>
                </Grid>
              </Grid>

              {scanResult.anomalies.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Detected Anomalies ({scanResult.anomalies.length})</Typography>
                  <List dense>
                    {scanResult.anomalies.map((anomaly, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={anomaly}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {scanResult.trafficStats.packetsPerSecond === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">No Network Traffic Detected</Typography>
                  <Typography variant="body2">
                    This could mean:
                  </Typography>
                  <ul style={{ marginTop: '8px', marginBottom: '8px' }}>
                    <li>The IP address is not generating traffic while being monitored</li>
                    <li>The IP is on a different network segment not visible to this monitoring system</li>
                    <li>The IP address is not reachable from this monitoring location</li>
                  </ul>
                  <Typography variant="body2">
                    <strong>Tip:</strong> Try monitoring a public IP (like 8.8.8.8) or an IP that you can actively generate traffic to while monitoring.
                  </Typography>
                </Alert>
              )}

              {Object.keys(scanResult.trafficStats.protocols).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Protocol Distribution</Typography>
                  <Box sx={{ pl: 2 }}>
                    {Object.entries(scanResult.trafficStats.protocols).map(([protocol, count]) => (
                      <Typography key={protocol} variant="body2">
                        {protocol}: {count} packets
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
            </Paper>
          )}
        </Box>
      </TabPanel>

      {/* Tab 2: Active Monitors */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Currently Monitored IP Addresses
          </Typography>
          <Button 
            startIcon={<RefreshIcon />}
            onClick={loadMonitoredIps}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          monitoredIps.length > 0 ? (
            <List>
              {monitoredIps.map(ip => (
                <ListItem key={ip}>
                  <ListItemText 
                    primary={ip} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="scan" onClick={() => handleScanIp(ip)} sx={{ mr: 1 }}>
                      <PlayArrowIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleStopMonitoring(ip)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">No IP addresses are currently being monitored.</Alert>
          )
        )}
      </TabPanel>

      {/* Tab 3: Monitoring Logs */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="ip-select-label">Select IP Address</InputLabel>
            <Select
              labelId="ip-select-label"
              value={selectedIp}
              label="Select IP Address"
              onChange={(e) => handleViewLogs(e.target.value)}
            >
              <MenuItem value="" disabled>
                <em>Select an IP address</em>
              </MenuItem>
              {monitoredIps.map(ip => (
                <MenuItem key={ip} value={ip}>{ip}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {logsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : selectedIp ? (
          monitoringLogs.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Monitoring Logs for {selectedIp}
              </Typography>
              
              {monitoringLogs.map((log, index) => (
                <Accordion key={log._id || index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ flexGrow: 1 }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </Typography>
                    <Chip 
                      label={log.severity} 
                      color={getSeverityColor(log.severity)} 
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={log.type.replace('_', ' ')} 
                      variant="outlined" 
                      size="small"
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">AI Analysis</Typography>
                        <Typography variant="body2" paragraph>{log.aiAnalysis}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Recommendation</Typography>
                        <Typography variant="body2" paragraph>{log.aiRecommendation}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">Details</Typography>
                        <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'background.default' }}>
                          <pre style={{ margin: 0, overflow: 'auto' }}>
                            {log.requestBody}
                          </pre>
                        </Paper>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Alert severity="info">No monitoring logs found for this IP address.</Alert>
          )
        ) : (
          <Alert severity="info">Select an IP address to view its monitoring logs.</Alert>
        )}
      </TabPanel>
    </Paper>
  );
};

export default IpMonitor;