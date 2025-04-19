import { exec } from 'child_process';
import util from 'util';
import net from 'net';
import MaliciousRequest, { SeverityLevel, RequestType, ReportStatus } from '../models/MaliciousRequest';
import aiService from './aiService';

const execPromise = util.promisify(exec);

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

class MonitoringService {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Validate if the provided string is a valid IP address
   */
  isValidIpAddress(ip: string): boolean {
    return net.isIP(ip) !== 0;
  }

  /**
   * Ping the target IP to check if it's online and get response metrics
   */
  async pingHost(ip: string): Promise<{ packetLoss: number, responseTime: number }> {
    try {
      // Execute ping command (4 packets, 2 second timeout)
      const { stdout } = await execPromise(`ping -c 4 -W 2 ${ip}`);
      
      // Extract packet loss percentage using regex
      const packetLossMatch = stdout.match(/(\d+)% packet loss/);
      const packetLoss = packetLossMatch ? parseInt(packetLossMatch[1], 10) : 100;
      
      // Extract average response time using regex
      const responseTimeMatch = stdout.match(/rtt min\/avg\/max\/mdev = [\d.]+\/([\d.]+)/);
      const responseTime = responseTimeMatch ? parseFloat(responseTimeMatch[1]) : 0;
      
      return { packetLoss, responseTime };
    } catch (error) {
      console.error(`Error pinging ${ip}:`, error);
      return { packetLoss: 100, responseTime: 0 };
    }
  }

  /**
   * Scan for open ports on the target IP
   */
  async scanPorts(ip: string, portRange: string = '20-1000'): Promise<{ port: number, state: 'open' | 'closed' | 'filtered', service?: string }[]> {
    try {
      // Execute nmap scan (adjust paths/options as needed)
      const { stdout } = await execPromise(`nmap -p ${portRange} --open ${ip}`);
      
      const ports: { port: number, state: 'open' | 'closed' | 'filtered', service?: string }[] = [];
      
      // Parse the output to extract open ports
      const portRegex = /(\d+)\/tcp\s+open\s+(\w+)?/g;
      let match;
      
      while ((match = portRegex.exec(stdout)) !== null) {
        ports.push({
          port: parseInt(match[1], 10),
          state: 'open',
          service: match[2] || undefined
        });
      }
      
      return ports;
    } catch (error) {
      console.error(`Error scanning ports for ${ip}:`, error);
      return [];
    }
  }

  /**
   * Check for unusual traffic patterns
   */
  async checkTraffic(ip: string): Promise<{ trafficVolume: number, connectionAttempts: number }> {
    try {
      // In a real-world scenario, this would use netstat, tcpdump, or other network monitoring tools
      // For demonstration purposes, we'll generate simulated traffic
      const trafficVolume = Math.floor(Math.random() * 1000); // KB/s
      const connectionAttempts = Math.floor(Math.random() * 20); // connections/min
      
      return { trafficVolume, connectionAttempts };
    } catch (error) {
      console.error(`Error checking traffic for ${ip}:`, error);
      return { trafficVolume: 0, connectionAttempts: 0 };
    }
  }

  /**
   * Determine if activity is suspicious based on monitoring data
   */
  isSuspiciousActivity(result: Partial<MonitoringResult>): boolean {
    // In a real implementation, this would have more sophisticated logic
    const highTraffic = (result.trafficVolume || 0) > 500; // If traffic > 500 KB/s
    const manyConnections = (result.connectionAttempts || 0) > 10; // If > 10 connection attempts per minute
    const manyOpenPorts = (result.ports || []).length > 5; // If more than 5 open ports
    const commonMaliciousPorts = [21, 22, 23, 25, 53, 80, 443, 445, 3389];
    const hasCommonPorts = (result.ports || []).some(p => commonMaliciousPorts.includes(p.port));
    
    // Simplistic detection logic for demonstration
    return highTraffic || manyConnections || (manyOpenPorts && hasCommonPorts);
  }

  /**
   * Monitor an IP address and log results
   */
  async monitorIp(ip: string): Promise<MonitoringResult> {
    // Validate IP address
    if (!this.isValidIpAddress(ip)) {
      throw new Error(`Invalid IP address: ${ip}`);
    }
    
    // Gather monitoring data
    const pingResult = await this.pingHost(ip);
    const portsResult = await this.scanPorts(ip);
    const trafficResult = await this.checkTraffic(ip);
    
    // Combine results
    const result: MonitoringResult = {
      timestamp: new Date(),
      targetIp: ip,
      ports: portsResult,
      packetLoss: pingResult.packetLoss,
      responseTime: pingResult.responseTime,
      ...trafficResult,
      suspiciousActivity: false
    };
    
    // Determine if activity is suspicious
    result.suspiciousActivity = this.isSuspiciousActivity(result);
    
    // If suspicious, create a malicious request entry
    if (result.suspiciousActivity) {
      await this.logSuspiciousActivity(result);
    }
    
    return result;
  }

  /**
   * Log suspicious activity to the database for AI analysis
   */
  async logSuspiciousActivity(result: MonitoringResult): Promise<void> {
    try {
      // Prepare data for AI analysis
      const requestMethod = 'MONITOR'; // Custom method for monitoring
      const requestUrl = `ip://${result.targetIp}`;
      const requestHeaders = {};
      const requestBody = JSON.stringify(result, null, 2);
      
      // Use AI service to analyze the monitoring data
      const aiAnalysisResult = await aiService.analyzeMaliciousRequest(
        requestUrl,
        requestMethod,
        requestHeaders,
        requestBody,
        result.targetIp
      );
      
      // Create a new malicious request report
      const maliciousRequest = new MaliciousRequest({
        requestUrl,
        requestMethod,
        requestHeaders,
        requestBody,
        sourceIp: result.targetIp,
        description: `Automated monitoring detected suspicious activity on IP ${result.targetIp}`,
        severity: aiAnalysisResult.severity,
        type: aiAnalysisResult.type,
        aiAnalysis: aiAnalysisResult.analysis,
        aiRecommendation: aiAnalysisResult.recommendation,
        status: ReportStatus.NEW
      });
      
      // Save to database
      await maliciousRequest.save();
      
      console.log(`Logged suspicious activity for IP ${result.targetIp}`);
    } catch (error) {
      console.error('Error logging suspicious activity:', error);
    }
  }

  /**
   * Start continuous monitoring of an IP address
   */
  startContinuousMonitoring(ip: string, intervalMinutes: number = 5): void {
    // Validate IP
    if (!this.isValidIpAddress(ip)) {
      throw new Error(`Invalid IP address: ${ip}`);
    }
    
    // Stop any existing monitoring
    this.stopMonitoring(ip);
    
    // Convert minutes to milliseconds
    const interval = intervalMinutes * 60 * 1000;
    
    // Run an initial scan immediately
    this.monitorIp(ip).catch(err => console.error(`Error monitoring IP ${ip}:`, err));
    
    // Set up interval for continuous scanning
    const intervalId = setInterval(async () => {
      try {
        await this.monitorIp(ip);
      } catch (error) {
        console.error(`Error in continuous monitoring for ${ip}:`, error);
      }
    }, interval);
    
    // Store the interval ID for later cleanup
    this.monitoringIntervals.set(ip, intervalId);
    
    console.log(`Started continuous monitoring of IP ${ip} every ${intervalMinutes} minutes`);
  }

  /**
   * Stop monitoring an IP address
   */
  stopMonitoring(ip: string): void {
    const intervalId = this.monitoringIntervals.get(ip);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(ip);
      console.log(`Stopped monitoring IP ${ip}`);
    }
  }

  /**
   * Get all currently monitored IPs
   */
  getMonitoredIps(): string[] {
    return Array.from(this.monitoringIntervals.keys());
  }
}

export default new MonitoringService();