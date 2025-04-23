import { exec, spawn } from 'child_process';
import util from 'util';
import net from 'net';
import fs from 'fs';
import path from 'path';
import MaliciousRequest, { SeverityLevel, RequestType, ReportStatus } from '../models/MaliciousRequest';
import aiService from './aiService';

const execPromise = util.promisify(exec);

interface PacketData {
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  length: number;
  info: string;
}

interface TrafficStats {
  packetsPerSecond: number;
  bytesPerSecond: number;
  uniqueSources: Set<string>;
  protocols: Map<string, number>;
  connectionAttempts: number;
}

interface MonitoringResult {
  timestamp: Date;
  targetIp: string;
  trafficStats: TrafficStats;
  suspiciousActivity: boolean;
  anomalies: string[];
}

class MonitoringService {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private tcpdumpProcesses: Map<string, any> = new Map();
  private baselineStats: Map<string, TrafficStats> = new Map();
  private readonly PACKETS_SAMPLE_SIZE = 1000; // Number of packets to establish baseline
  private readonly ANOMALY_THRESHOLD = 2.0; // Standard deviations for anomaly detection
  private readonly DEFAULT_SCAN_DURATION = 60; // seconds
  private readonly DEFAULT_BASELINE_DURATION = 300; // seconds (5 minutes)
  private readonly tempDir: string;

  constructor() {
    // Initialize temp directory in project root
    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Handle process termination
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  private cleanup(): void {
    // Stop all monitoring
    for (const ip of this.monitoringIntervals.keys()) {
      this.stopMonitoring(ip);
    }

    // Clean up temp files
    if (fs.existsSync(this.tempDir)) {
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(this.tempDir, file));
        } catch (error) {
          console.error(`Error cleaning up file ${file}:`, error);
        }
      }
    }
  }

  isValidIpAddress(ip: string): boolean {
    return net.isIP(ip) !== 0;
  }

  private async startPacketCapture(ip: string): Promise<string> {
    const captureFile = path.join(this.tempDir, `capture_${ip}_${Date.now()}.pcap`);
    
    return new Promise((resolve, reject) => {
      try {
        const tcpdumpProcess = spawn('tcpdump', [
          '-i', 'any',
          'host', ip,
          '-w', captureFile,
          '-n'  // Don't convert addresses to names
        ], {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        // Handle process events
        tcpdumpProcess.on('error', (error) => {
          console.error(`tcpdump process error for ${ip}:`, error);
          reject(error);
        });

        // Wait for tcpdump to start capturing
        tcpdumpProcess.stderr.on('data', (data) => {
          const output = data.toString();
          if (output.includes('listening on')) {
            this.tcpdumpProcesses.set(ip, tcpdumpProcess);
            resolve(captureFile);
          } else if (output.includes('permission denied')) {
            reject(new Error('Permission denied. Please ensure tcpdump has proper permissions.'));
          }
        });

        // Handle unexpected exit
        tcpdumpProcess.on('exit', (code, signal) => {
          if (!this.tcpdumpProcesses.has(ip)) {
            if (code !== null && code !== 0) {
              reject(new Error(`tcpdump process exited with code ${code}`));
            } else if (signal) {
              reject(new Error(`tcpdump process was killed with signal ${signal}`));
            }
          }
        });

        // Set a timeout in case tcpdump doesn't start properly
        setTimeout(() => {
          if (!this.tcpdumpProcesses.has(ip)) {
            tcpdumpProcess.kill();
            reject(new Error('Timeout waiting for tcpdump to start'));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async analyzePackets(captureFile: string): Promise<PacketData[]> {
    try {
      const { stdout } = await execPromise(`tcpdump -r ${captureFile} -nn -tttt`);
      const packets: PacketData[] = [];
      
      stdout.split('\n').forEach(line => {
        if (line.trim()) {
          const parsed = this.parsePacketLine(line);
          if (parsed) packets.push(parsed);
        }
      });

      return packets;
    } catch (error) {
      console.error('Error analyzing packets:', error);
      throw error;
    }
  }

  private parsePacketLine(line: string): PacketData | null {
    // Example: 2023-04-22 10:15:23.123456 IP 192.168.1.1.80 > 192.168.1.2.12345: TCP flags [S.], length 0
    const regex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+) IP (\d+\.\d+\.\d+\.\d+)(?:.\d+)? > (\d+\.\d+\.\d+\.\d+)(?:.\d+)?: (\w+) (.*)/;
    const match = line.match(regex);
    
    if (match) {
      return {
        timestamp: match[1],
        sourceIp: match[2],
        destinationIp: match[3],
        protocol: match[4],
        length: parseInt(line.match(/length (\d+)/)?.[1] || '0'),
        info: match[5]
      };
    }
    return null;
  }

  private calculateTrafficStats(packets: PacketData[]): TrafficStats {
    const stats: TrafficStats = {
      packetsPerSecond: 0,
      bytesPerSecond: 0,
      uniqueSources: new Set<string>(),
      protocols: new Map<string, number>(),
      connectionAttempts: 0
    };

    if (packets.length < 2) return stats;

    const startTime = new Date(packets[0].timestamp).getTime();
    const endTime = new Date(packets[packets.length - 1].timestamp).getTime();
    const duration = (endTime - startTime) / 1000; // in seconds

    let totalBytes = 0;
    packets.forEach(packet => {
      stats.uniqueSources.add(packet.sourceIp);
      totalBytes += packet.length;
      
      // Count protocol occurrences
      const currentCount = stats.protocols.get(packet.protocol) || 0;
      stats.protocols.set(packet.protocol, currentCount + 1);
      
      // Count connection attempts (TCP SYN packets)
      if (packet.protocol === 'TCP' && packet.info.includes('flags [S]')) {
        stats.connectionAttempts++;
      }
    });

    stats.packetsPerSecond = packets.length / duration;
    stats.bytesPerSecond = totalBytes / duration;

    return stats;
  }

  private detectAnomalies(currentStats: TrafficStats, baselineStats: TrafficStats): string[] {
    const anomalies: string[] = [];

    // Check packets per second
    if (currentStats.packetsPerSecond > baselineStats.packetsPerSecond * this.ANOMALY_THRESHOLD) {
      anomalies.push(`High packet rate: ${currentStats.packetsPerSecond.toFixed(2)} pps vs baseline ${baselineStats.packetsPerSecond.toFixed(2)} pps`);
    }

    // Check bytes per second
    if (currentStats.bytesPerSecond > baselineStats.bytesPerSecond * this.ANOMALY_THRESHOLD) {
      anomalies.push(`High traffic volume: ${(currentStats.bytesPerSecond / 1024).toFixed(2)} KB/s vs baseline ${(baselineStats.bytesPerSecond / 1024).toFixed(2)} KB/s`);
    }

    // Check unique sources
    if (currentStats.uniqueSources.size > baselineStats.uniqueSources.size * this.ANOMALY_THRESHOLD) {
      anomalies.push(`Unusual number of unique sources: ${currentStats.uniqueSources.size} vs baseline ${baselineStats.uniqueSources.size}`);
    }

    // Check connection attempts
    if (currentStats.connectionAttempts > baselineStats.connectionAttempts * this.ANOMALY_THRESHOLD) {
      anomalies.push(`High number of connection attempts: ${currentStats.connectionAttempts} vs baseline ${baselineStats.connectionAttempts}`);
    }

    return anomalies;
  }

  private async monitorForDuration(ip: string, durationSeconds: number): Promise<void> {
    const abortController = new AbortController();
    const signal = abortController.signal;

    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, durationSeconds * 1000);

        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          resolve(null);
        });
      });
    } finally {
      if (!signal.aborted) {
        abortController.abort();
      }
    }
  }

  private async establishBaseline(ip: string): Promise<void> {
    console.log(`Establishing baseline for ${ip}...`);
    let captureFile: string | null = null;
    
    try {
      captureFile = await this.startPacketCapture(ip);
      await this.monitorForDuration(ip, this.DEFAULT_BASELINE_DURATION);
      
      const tcpdumpProcess = this.tcpdumpProcesses.get(ip);
      if (tcpdumpProcess) {
        tcpdumpProcess.kill('SIGTERM');
        this.tcpdumpProcesses.delete(ip);
      }

      const packets = await this.analyzePackets(captureFile);
      const baselineStats = this.calculateTrafficStats(packets);
      this.baselineStats.set(ip, baselineStats);
    } finally {
      if (captureFile && fs.existsSync(captureFile)) {
        try {
          fs.unlinkSync(captureFile);
        } catch (error) {
          console.error('Error cleaning up baseline capture file:', error);
        }
      }
    }
  }

  async monitorIp(ip: string, durationSeconds: number = this.DEFAULT_SCAN_DURATION): Promise<MonitoringResult> {
    if (!this.isValidIpAddress(ip)) {
      throw new Error(`Invalid IP address: ${ip}`);
    }

    let captureFile: string | null = null;
    try {
      // If no baseline exists, establish one
      if (!this.baselineStats.has(ip)) {
        await this.establishBaseline(ip);
      }

      captureFile = await this.startPacketCapture(ip);
      await this.monitorForDuration(ip, durationSeconds);
      
      const tcpdumpProcess = this.tcpdumpProcesses.get(ip);
      if (tcpdumpProcess) {
        tcpdumpProcess.kill('SIGTERM');
        this.tcpdumpProcesses.delete(ip);
      }

      const packets = await this.analyzePackets(captureFile);
      const currentStats = this.calculateTrafficStats(packets);
      const baselineStats = this.baselineStats.get(ip)!;
      const anomalies = this.detectAnomalies(currentStats, baselineStats);

      const result: MonitoringResult = {
        timestamp: new Date(),
        targetIp: ip,
        trafficStats: currentStats,
        suspiciousActivity: anomalies.length > 0,
        anomalies
      };

      if (result.suspiciousActivity) {
        await this.logSuspiciousActivity(result);
      }

      return result;
    } catch (error) {
      console.error(`Error monitoring IP ${ip}:`, error);
      throw error;
    } finally {
      // Ensure cleanup of any remaining processes and files
      const tcpdumpProcess = this.tcpdumpProcesses.get(ip);
      if (tcpdumpProcess) {
        tcpdumpProcess.kill('SIGTERM');
        this.tcpdumpProcesses.delete(ip);
      }
      if (captureFile && fs.existsSync(captureFile)) {
        try {
          fs.unlinkSync(captureFile);
        } catch (error) {
          // Just log cleanup errors, don't throw
          console.error('Error cleaning up capture file:', error);
        }
      }
    }
  }

  async logSuspiciousActivity(result: MonitoringResult): Promise<void> {
    try {
      const requestMethod = 'MONITOR';
      const requestUrl = `ip://${result.targetIp}`;
      const requestHeaders = {};
      const requestBody = JSON.stringify(result, null, 2);
      
      const aiAnalysisResult = await aiService.analyzeMaliciousRequest(
        requestUrl,
        requestMethod,
        requestHeaders,
        requestBody,
        result.targetIp
      );
      
      const maliciousRequest = new MaliciousRequest({
        requestUrl,
        requestMethod,
        requestHeaders,
        requestBody,
        sourceIp: result.targetIp,
        description: `Automated monitoring detected suspicious activity: ${result.anomalies.join('; ')}`,
        severity: aiAnalysisResult.severity,
        type: aiAnalysisResult.type,
        aiAnalysis: aiAnalysisResult.analysis,
        aiRecommendation: aiAnalysisResult.recommendation,
        status: ReportStatus.NEW
      });
      
      await maliciousRequest.save();
      console.log(`Logged suspicious activity for IP ${result.targetIp}`);
    } catch (error) {
      console.error('Error logging suspicious activity:', error);
    }
  }

  startContinuousMonitoring(ip: string, intervalMinutes: number = 5): void {
    if (!this.isValidIpAddress(ip)) {
      throw new Error(`Invalid IP address: ${ip}`);
    }
    
    this.stopMonitoring(ip);
    
    const interval = intervalMinutes * 60 * 1000;
    
    // Run initial monitoring
    this.monitorIp(ip).catch(err => console.error(`Error monitoring IP ${ip}:`, err));
    
    const intervalId = setInterval(async () => {
      try {
        await this.monitorIp(ip);
      } catch (error) {
        console.error(`Error in continuous monitoring for ${ip}:`, error);
      }
    }, interval);
    
    this.monitoringIntervals.set(ip, intervalId);
    console.log(`Started continuous monitoring of IP ${ip} every ${intervalMinutes} minutes`);
  }

  stopMonitoring(ip: string): void {
    const intervalId = this.monitoringIntervals.get(ip);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(ip);
    }

    const tcpdumpProcess = this.tcpdumpProcesses.get(ip);
    if (tcpdumpProcess) {
      tcpdumpProcess.kill();
      this.tcpdumpProcesses.delete(ip);
    }

    console.log(`Stopped monitoring IP ${ip}`);
  }

  getMonitoredIps(): string[] {
    return Array.from(this.monitoringIntervals.keys());
  }
}

export default new MonitoringService();