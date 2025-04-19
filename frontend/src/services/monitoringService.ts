import axios from 'axios';

interface MonitoringResult {
  timestamp: Date;
  targetIp: string;
  ports: {
    port: number;
    state: 'open' | 'closed' | 'filtered';
    service?: string;
  }[];
  packetLoss: number;
  responseTime: number;
  suspiciousActivity: boolean;
  trafficVolume?: number;
  connectionAttempts?: number;
}

interface MonitoringLogsResponse {
  logs: any[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

const API_URL = 'http://localhost:5000/api/monitor';

// Start monitoring an IP address
export const startMonitoring = async (ip: string, intervalMinutes?: number) => {
  const response = await axios.post(API_URL, { ip, interval: intervalMinutes });
  return response.data;
};

// Stop monitoring an IP address
export const stopMonitoring = async (ip: string) => {
  const response = await axios.delete(`${API_URL}/${ip}`);
  return response.data;
};

// Get all monitored IP addresses
export const getMonitoredIps = async () => {
  const response = await axios.get(API_URL);
  return response.data.ips as string[];
};

// Run a one-time scan on an IP address
export const scanIp = async (ip: string) => {
  const response = await axios.get(`${API_URL}/${ip}/scan`);
  return response.data as MonitoringResult;
};

// Get monitoring logs for an IP address
export const getMonitoringLogs = async (ip: string, page = 1, limit = 10) => {
  const response = await axios.get(`${API_URL}/${ip}/logs`, {
    params: { page, limit }
  });
  return response.data as MonitoringLogsResponse;
};