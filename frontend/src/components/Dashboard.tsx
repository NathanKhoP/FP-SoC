import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  BugReport as BugReportIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { getMaliciousRequests, getMaliciousRequestStats } from '../services/maliciousRequestService';
import AttackChatIntegration from './AttackChatIntegration';
import { MaliciousRequest, MaliciousRequestStats } from '../types';

const Dashboard: React.FC = () => {
  const [recentAttacks, setRecentAttacks] = useState<MaliciousRequest[]>([]);
  const [stats, setStats] = useState<MaliciousRequestStats | null>(null);
  const [selectedAttack, setSelectedAttack] = useState<MaliciousRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [attacksResponse, statsData] = await Promise.all([
        getMaliciousRequests(1, 10), // Get recent 10 attacks
        getMaliciousRequestStats()
      ]);
      
      setRecentAttacks(attacksResponse.maliciousRequests);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  const handleAttackSelect = (attack: MaliciousRequest) => {
    setSelectedAttack(attack);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon />
        Security Operations Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugReportIcon color="error" />
                  <Typography variant="h6">Total Reports</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {stats.statusCounts.reduce((sum, item) => sum + item.count, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="h6">Critical/High</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {stats.severityCounts
                    .filter(item => ['critical', 'high'].includes(item._id))
                    .reduce((sum, item) => sum + item.count, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnalyticsIcon color="primary" />
                  <Typography variant="h6">Attack Types</Typography>
                </Box>
                <Typography variant="h4" color="primary.main">
                  {stats.typeCounts.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="success" />
                  <Typography variant="h6">Resolved</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {stats.statusCounts.find(item => item._id === 'resolved')?.count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Attack Analysis Integration */}
      {selectedAttack && (
        <AttackChatIntegration
          attackId={selectedAttack._id}
          attackSummary={{
            sourceIp: selectedAttack.sourceIp,
            type: selectedAttack.type,
            severity: selectedAttack.severity,
            url: selectedAttack.requestUrl
          }}
        />
      )}

      <Grid container spacing={3}>
        {/* Recent Attacks */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReportIcon />
              Recent Security Incidents
            </Typography>
            
            {recentAttacks.length > 0 ? (
              <List>
                {recentAttacks.map((attack, index) => (
                  <React.Fragment key={attack._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1">
                              {attack.sourceIp} → {attack.requestUrl}
                            </Typography>
                            <Chip 
                              label={attack.severity} 
                              color={getSeverityColor(attack.severity)}
                              size="small"
                            />
                            <Chip 
                              label={attack.type.replace('_', ' ')} 
                              variant="outlined"
                              size="small"
                            />
                            <Chip 
                              label={attack.status} 
                              color={attack.status === 'resolved' ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(attack.createdAt).toLocaleString()} • {attack.requestMethod}
                            </Typography>
                            {attack.aiAnalysis && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                <strong>AI Analysis:</strong> {attack.aiAnalysis.substring(0, 150)}
                                {attack.aiAnalysis.length > 150 && '...'}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AnalyticsIcon />}
                          onClick={() => handleAttackSelect(attack)}
                          color={selectedAttack?._id === attack._id ? 'primary' : 'inherit'}
                        >
                          Analyze
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < recentAttacks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Alert severity="info">No security incidents reported yet.</Alert>
            )}
          </Paper>
        </Grid>

        {/* Quick Stats & Top Attack Types */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Attack Types
            </Typography>
            {stats?.typeCounts.slice(0, 5).map((type, index) => (
              <Box key={type._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {index + 1}. {type._id.replace('_', ' ')}
                </Typography>
                <Chip label={type.count} size="small" variant="outlined" />
              </Box>
            ))}
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Severity Distribution
            </Typography>
            {stats?.severityCounts.map((severity) => (
              <Box key={severity._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Chip 
                  label={severity._id} 
                  color={getSeverityColor(severity._id)}
                  size="small"
                />
                <Typography variant="body2">{severity.count}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={loadDashboardData}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Refresh Data
        </Button>
        <Button 
          variant="contained"
          onClick={() => setSelectedAttack(null)}
          disabled={!selectedAttack}
        >
          Clear Selection
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;
