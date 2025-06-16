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
  trafficStats: {
    packetsPerSecond: number;
    bytesPerSecond: number;
    uniqueSources: string[]; // Array for JSON serialization
    protocols: Record<string, number>; // Object for JSON serialization
    connectionAttempts: number;
  };
  suspiciousActivity: boolean;
  anomalies: string[];
}

class MonitoringService {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private tcpdumpProcesses: Map<string, any> = new Map();
  private baselineStats: Map<string, TrafficStats> = new Map();
  private readonly PACKETS_SAMPLE_SIZE = 1000; // Number of packets to establish baseline
  private readonly ANOMALY_THRESHOLD = 2.0; // Standard deviations for anomaly detection
  private readonly DEFAULT_SCAN_DURATION = 30; // seconds (reduced for faster testing)
  private readonly DEFAULT_BASELINE_DURATION = 60; // seconds (reduced for faster baseline)
  private readonly tempDir: string;

  constructor() {
    // Initialize temp directory in project root
    this.tempDir = path.join(__dirname, '..', 'temp');
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
        // Try 'any' interface first for better compatibility
        const tcpdumpProcess = spawn('tcpdump', [
          '-i', 'any',  // Use 'any' interface directly
          'host', ip, 'or', 'src', ip, 'or', 'dst', ip,
          '-w', captureFile,
          '-n',  // Don't convert addresses to names
          '-v',  // Verbose mode for better debugging
          '-s', '0'  // Capture full packets
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
          console.log(`tcpdump stderr for ${ip}:`, output);
          
          if (output.includes('listening on')) {
            this.tcpdumpProcesses.set(ip, tcpdumpProcess);
            resolve(captureFile);
          } else if (output.includes('permission denied') || output.includes('Operation not permitted')) {
            reject(new Error('Permission denied. Please run the setup-tcpdump.sh script with sudo to configure tcpdump permissions.'));
          }
        });

        // Handle unexpected exit
        tcpdumpProcess.on('exit', (code, signal) => {
          if (!this.tcpdumpProcesses.has(ip)) {
            if (code !== null && code !== 0) {
              let errorMessage = `tcpdump process exited with code ${code}`;
              if (code === 1) {
                errorMessage += '. This is usually a permission issue. Please run setup-tcpdump.sh with sudo.';
              } else if (code === 2) {
                errorMessage += '. Invalid command line arguments.';
              }
              reject(new Error(errorMessage));
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

  private async startPacketCaptureWithAnyInterface(ip: string, captureFile: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const tcpdumpProcess = spawn('tcpdump', [
          '-i', 'any',
          'host', ip, 'or', 'src', ip, 'or', 'dst', ip,  // Broader filter
          '-w', captureFile,
          '-n',  // Don't convert addresses to names
          '-v',  // Verbose mode for better debugging
          '-s', '0'  // Capture full packets
        ], {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        // Handle process events
        tcpdumpProcess.on('error', (error) => {
          console.error(`tcpdump process error for ${ip} (any interface):`, error);
          reject(error);
        });

        // Wait for tcpdump to start capturing
        tcpdumpProcess.stderr.on('data', (data) => {
          const output = data.toString();
          console.log(`tcpdump stderr for ${ip} (any interface):`, output);
          
          if (output.includes('listening on')) {
            this.tcpdumpProcesses.set(ip, tcpdumpProcess);
            resolve(captureFile);
          } else if (output.includes('permission denied') || output.includes('Operation not permitted')) {
            reject(new Error('Permission denied. Please run the setup-tcpdump.sh script with sudo to configure tcpdump permissions.'));
          }
        });

        // Handle unexpected exit
        tcpdumpProcess.on('exit', (code, signal) => {
          if (!this.tcpdumpProcesses.has(ip)) {
            if (code !== null && code !== 0) {
              let errorMessage = `tcpdump process exited with code ${code}`;
              if (code === 1) {
                errorMessage += '. This is usually a permission issue. Please run setup-tcpdump.sh with sudo.';
              } else if (code === 2) {
                errorMessage += '. Invalid command line arguments.';
              }
              reject(new Error(errorMessage));
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
      // Check if the capture file exists and has content
      if (!fs.existsSync(captureFile)) {
        console.warn(`Capture file does not exist: ${captureFile}`);
        return [];
      }

      const stats = fs.statSync(captureFile);
      if (stats.size === 0) {
        console.warn(`Capture file is empty (0 bytes): ${captureFile}`);
        return [];
      }

      console.log(`Analyzing capture file: ${captureFile} (${stats.size} bytes)`);
      
      // If file is too large, limit the number of packets to analyze
      const maxPackets = 10000; // Limit to prevent memory issues
      const command = `tcpdump -r '${captureFile.replace(/'/g, "'\\''")}' -nn -tttt -c ${maxPackets}`;
      
      // Increase maxBuffer size to handle large outputs
      const { stdout } = await execPromise(command, { 
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer
      });
      
      const packets: PacketData[] = [];
      const lines = stdout.split('\n');
      
      console.log(`Processing ${lines.length} lines from tcpdump output`);
      
      let processedCount = 0;
      for (const line of lines) {
        if (line.trim()) {
          const parsed = this.parsePacketLine(line);
          if (parsed) {
            packets.push(parsed);
            processedCount++;
            
            // Progress logging for large captures
            if (processedCount % 1000 === 0) {
              console.log(`Processed ${processedCount} packets...`);
            }
          }
        }
      }

      console.log(`Analyzed ${packets.length} packets from capture file (${processedCount} total processed)`);
      return packets;
    } catch (error) {
      console.error('Error analyzing packets:', error);
      
      // If it's a buffer overflow error, try with fewer packets
      if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
        console.log('Buffer overflow detected, trying with limited packet count...');
        return this.analyzePacketsLimited(captureFile, 1000);
      }
      
      return [];
    }
  }

  private async analyzePacketsLimited(captureFile: string, maxPackets: number): Promise<PacketData[]> {
    try {
      console.log(`Analyzing first ${maxPackets} packets from large capture file`);
      
      const command = `tcpdump -r '${captureFile.replace(/'/g, "'\\''")}' -nn -tttt -c ${maxPackets}`;
      const { stdout } = await execPromise(command, { 
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for limited analysis
      });
      
      const packets: PacketData[] = [];
      stdout.split('\n').forEach(line => {
        if (line.trim()) {
          const parsed = this.parsePacketLine(line);
          if (parsed) packets.push(parsed);
        }
      });

      console.log(`Limited analysis: processed ${packets.length} packets`);
      return packets;
    } catch (error) {
      console.error('Error in limited packet analysis:', error);
      return [];
    }
  }

  private parsePacketLine(line: string): PacketData | null {
  // The tcpdump output with -tttt -nn should look like:
  // 2025-06-16 06:05:03.304220 IP 192.168.153.131.42858 > 74.125.200.94.80: Flags [.], ack 1093756488, win 63974, length 0
  
  // Try multiple regex patterns to handle different formats
  const patterns = [
    // Full timestamp format with IP and ports
    /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)\s+\w*\s*IP\s+(\d+\.\d+\.\d+\.\d+)(?:\.\d+)?\s+>\s+(\d+\.\d+\.\d+\.\d+)(?:\.\d+)?:\s+(\w+)\s+(.*)/,
    
    // Simplified format without ports
    /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)\s+\w*\s*IP\s+(\d+\.\d+\.\d+\.\d+)\s+>\s+(\d+\.\d+\.\d+\.\d+):\s+(\w+)\s+(.*)/,
    
    // Even more flexible format
    /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)\s+.*?(\d+\.\d+\.\d+\.\d+).*?>\s*(\d+\.\d+\.\d+\.\d+).*?(\w+)\s+(.*)/,
    
    // Handle ARP and other non-IP protocols
    /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)\s+\w*\s*(ARP|ICMP|UDP|TCP).*?(\d+\.\d+\.\d+\.\d+).*?(\d+\.\d+\.\d+\.\d+).*?(.*)/
  ];
  
  for (const regex of patterns) {
    const match = line.match(regex);
    if (match) {
      // Extract length from the line
      const lengthMatch = line.match(/length\s+(\d+)/);
      const length = lengthMatch ? parseInt(lengthMatch[1]) : 0;
      
      // For ARP and other protocols, handle differently
      if (match[2] === 'ARP' || match[2] === 'ICMP') {
        // Try to extract IPs from ARP/ICMP lines
        const ipMatches = line.match(/(\d+\.\d+\.\d+\.\d+)/g);
        if (ipMatches && ipMatches.length >= 2) {
          return {
            timestamp: match[1],
            sourceIp: ipMatches[0],
            destinationIp: ipMatches[1],
            protocol: match[2],
            length: length,
            info: match[5] || match[4] || ''
          };
        }
      } else {
        return {
          timestamp: match[1],
          sourceIp: match[2],
          destinationIp: match[3],
          protocol: match[4],
          length: length,
          info: match[5] || ''
        };
      }
    }
  }
  
  // If no pattern matches, try to extract basic info
  const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)/);
  const ipMatches = line.match(/(\d+\.\d+\.\d+\.\d+)/g);
  
  if (timestampMatch && ipMatches && ipMatches.length >= 2) {
    // Try to guess protocol
    let protocol = 'Unknown';
    if (line.includes('TCP')) protocol = 'TCP';
    else if (line.includes('UDP')) protocol = 'UDP';
    else if (line.includes('ICMP')) protocol = 'ICMP';
    else if (line.includes('ARP')) protocol = 'ARP';
    
    const lengthMatch = line.match(/length\s+(\d+)/);
    const length = lengthMatch ? parseInt(lengthMatch[1]) : 64; // Default size
    
    return {
      timestamp: timestampMatch[1],
      sourceIp: ipMatches[0],
      destinationIp: ipMatches[1],
      protocol: protocol,
      length: length,
      info: line.substring(timestampMatch[0].length).trim()
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

    if (packets.length === 0) {
      console.log('No packets captured - returning baseline zero stats');
      return stats;
    }

    if (packets.length < 2) {
      // Single packet - minimal stats
      const packet = packets[0];
      stats.uniqueSources.add(packet.sourceIp);
      stats.protocols.set(packet.protocol, 1);
      if (packet.protocol === 'TCP' && packet.info.includes('flags [S]')) {
        stats.connectionAttempts = 1;
      }
      // For single packet, assume 1 second duration
      stats.packetsPerSecond = 1;
      stats.bytesPerSecond = packet.length;
      return stats;
    }

    const startTime = new Date(packets[0].timestamp).getTime();
    const endTime = new Date(packets[packets.length - 1].timestamp).getTime();
    const duration = Math.max((endTime - startTime) / 1000, 1); // Minimum 1 second to avoid division by zero

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

    // If both baseline and current have zero traffic, no anomalies
    if (baselineStats.packetsPerSecond === 0 && currentStats.packetsPerSecond === 0) {
      console.log('No traffic in baseline or current - no anomalies detected');
      return anomalies;
    }

    // If baseline has zero traffic but current has traffic, that's potentially suspicious
    if (baselineStats.packetsPerSecond === 0 && currentStats.packetsPerSecond > 0) {
      anomalies.push(`New traffic detected: ${currentStats.packetsPerSecond.toFixed(2)} pps (no baseline traffic)`);
      return anomalies;
    }

    // Standard anomaly detection with thresholds
    if (currentStats.packetsPerSecond > baselineStats.packetsPerSecond * this.ANOMALY_THRESHOLD) {
      anomalies.push(`High packet rate: ${currentStats.packetsPerSecond.toFixed(2)} pps vs baseline ${baselineStats.packetsPerSecond.toFixed(2)} pps`);
    }

    if (currentStats.bytesPerSecond > baselineStats.bytesPerSecond * this.ANOMALY_THRESHOLD) {
      anomalies.push(`High traffic volume: ${(currentStats.bytesPerSecond / 1024).toFixed(2)} KB/s vs baseline ${(baselineStats.bytesPerSecond / 1024).toFixed(2)} KB/s`);
    }

    if (currentStats.uniqueSources.size > Math.max(baselineStats.uniqueSources.size * this.ANOMALY_THRESHOLD, 1)) {
      anomalies.push(`Unusual number of unique sources: ${currentStats.uniqueSources.size} vs baseline ${baselineStats.uniqueSources.size}`);
    }

    if (currentStats.connectionAttempts > Math.max(baselineStats.connectionAttempts * this.ANOMALY_THRESHOLD, 1)) {
      anomalies.push(`High number of connection attempts: ${currentStats.connectionAttempts} vs baseline ${baselineStats.connectionAttempts}`);
    }

    return anomalies;
  }

  private async monitorForDuration(ip: string, durationSeconds: number): Promise<void> {
    console.log(`Monitoring ${ip} for ${durationSeconds} seconds...`);
    await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
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
        // Give tcpdump a moment to write final packets
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const packets = await this.analyzePackets(captureFile);
      const baselineStats = this.calculateTrafficStats(packets);
      this.baselineStats.set(ip, baselineStats);
      
      console.log(`Baseline established for ${ip}: ${packets.length} packets, ${baselineStats.packetsPerSecond.toFixed(2)} pps`);
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

    // First, let's test basic connectivity and get network info
    console.log(`Starting monitoring for ${ip}...`);
    await this.generateTestTraffic(ip);

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
        // Give tcpdump a moment to write final packets
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const packets = await this.analyzePackets(captureFile);
      const currentStats = this.calculateTrafficStats(packets);
      const baselineStats = this.baselineStats.get(ip)!;
      const anomalies = this.detectAnomalies(currentStats, baselineStats);

      const result: MonitoringResult = {
        timestamp: new Date(),
        targetIp: ip,
        trafficStats: {
          packetsPerSecond: currentStats.packetsPerSecond,
          bytesPerSecond: currentStats.bytesPerSecond,
          uniqueSources: Array.from(currentStats.uniqueSources), // Convert Set to Array for JSON
          protocols: Object.fromEntries(currentStats.protocols), // Convert Map to Object for JSON
          connectionAttempts: currentStats.connectionAttempts
        },
        suspiciousActivity: anomalies.length > 0,
        anomalies
      };

      console.log(`Monitoring complete for ${ip}: ${packets.length} packets captured, ${anomalies.length} anomalies detected`);

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
        tcpdumpProcess.kill();
        this.tcpdumpProcesses.delete(ip);
      }
      
      // COMMENT OUT THE FILE DELETION FOR DEBUGGING
      // if (captureFile && fs.existsSync(captureFile)) {
      //   try {
      //     fs.unlinkSync(captureFile);
      //   } catch (error) {
      //     console.error('Error cleaning up capture file:', error);
      //   }
      // }
      
      // OR add a debug flag to preserve files
      const PRESERVE_CAPTURE_FILES = true; // Set to false in production
      if (captureFile && fs.existsSync(captureFile) && !PRESERVE_CAPTURE_FILES) {
        try {
          fs.unlinkSync(captureFile);
        } catch (error) {
          // Just log cleanup errors, don't throw
          console.error('Error cleaning up capture file:', error);
        }
      } else if (captureFile) {
        console.log(`Preserving capture file for debugging: ${captureFile}`);
      }
    }
  }

  private async generateTestTraffic(ip: string): Promise<void> {
    console.log(`Generating test traffic to ${ip} to verify monitoring...`);
    
    try {
      // Check if this is a public IP or local IP
      const isPublicIp = !this.isPrivateIp(ip);
      
      if (isPublicIp) {
        // For public IPs, generate some real traffic
        console.log(`${ip} appears to be a public IP, generating real traffic...`);
        
        // Generate HTTP traffic
        const httpTests = [
          execPromise(`curl -m 5 --connect-timeout 2 http://${ip}/ || true`),
          execPromise(`curl -m 5 --connect-timeout 2 https://${ip}/ || true`),
        ];
        
        // Generate ping traffic
        const pingPromise = execPromise(`ping -c 3 ${ip} || true`);
        
        await Promise.all([pingPromise, ...httpTests]);
      } else {
        // For private IPs, try basic connectivity tests
        console.log(`${ip} appears to be a private IP, testing basic connectivity...`);
        
        const pingPromise = execPromise(`ping -c 5 ${ip} || true`);
        
        // Try a few common ports
        const portTests = [22, 80, 443, 21, 23].map(port => 
          execPromise(`timeout 2 nc -z ${ip} ${port} 2>/dev/null || true`)
        );

        await Promise.all([pingPromise, ...portTests]);
      }
      
      // Give a moment for packets to be captured
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`Test traffic generation completed for ${ip}`);
    }
  }

  private isPrivateIp(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    return (
      (parts[0] === 10) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  }

  async logSuspiciousActivity(result: MonitoringResult): Promise<void> {
    try {
      const requestMethod = 'MONITOR';
      const requestUrl = `ip://${result.targetIp}`;
      const requestHeaders = {};
      const requestBody = JSON.stringify({
        timestamp: result.timestamp,
        targetIp: result.targetIp,
        trafficStats: result.trafficStats,
        anomalies: result.anomalies,
        suspiciousActivity: result.suspiciousActivity
      }, null, 2);
      
      console.log(`Logging suspicious activity for IP ${result.targetIp}`);
      
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
        sourceIp: result.targetIp,  // The IP being monitored
        description: `Automated monitoring detected suspicious activity on ${result.targetIp}: ${result.anomalies.join('; ')}`,
        severity: aiAnalysisResult.severity,
        type: aiAnalysisResult.type,
        aiAnalysis: aiAnalysisResult.analysis,
        aiRecommendation: Array.isArray(aiAnalysisResult.recommendation)
          ? aiAnalysisResult.recommendation.join("\n")
          : String(aiAnalysisResult.recommendation),
        status: ReportStatus.NEW
      });
        await maliciousRequest.save();
      console.log(`Successfully logged suspicious activity for IP ${result.targetIp} with ID: ${maliciousRequest._id}`);
      
      // Debug: Verify the log was saved and can be queried
      const savedLog = await MaliciousRequest.findById(maliciousRequest._id);
      console.log(`Verification - Log saved with sourceIp: ${savedLog?.sourceIp}, method: ${savedLog?.requestMethod}`);
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