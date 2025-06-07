import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import aiService from '../services/aiService';
import MaliciousRequest from '../models/MaliciousRequest';
import monitoringService from '../services/monitoringService';
import fs from 'fs';
import path from 'path';

// Process a chatbot message
export const processMessage = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { messages, ipContext, includeSystemLogs = false, attackId } = req.body;
    
    // Gather comprehensive context data
    let contextData = await gatherSecurityContext(ipContext, includeSystemLogs, attackId);

    // Process message using Groq LLM
    const response = await processWithGroq(messages, contextData);
    
    res.json({ response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Gather comprehensive security context for the chatbot
const gatherSecurityContext = async (ipContext?: string, includeSystemLogs: boolean = false, attackId?: string): Promise<string> => {
  let contextData = '';
  
  try {
    // 1. IP-specific monitoring data
    if (ipContext) {
      const recentLogs = await MaliciousRequest.find({
        sourceIp: ipContext,
        requestMethod: 'MONITOR'
      })
      .sort({ createdAt: -1 })
      .limit(10);
      
      if (recentLogs.length > 0) {
        contextData += await aiService.prepareMonitoringDataForChatbot(recentLogs);
        contextData += '\n\n';
      }
      
      // Get current monitoring status for the IP
      const monitoredIps = monitoringService.getMonitoredIps();
      if (monitoredIps.includes(ipContext)) {
        contextData += `STATUS: IP ${ipContext} is currently being monitored.\n\n`;
      }
    }

    // 2. Recent attack reports (last 24 hours)
    const recentAttacks = await MaliciousRequest.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      requestMethod: { $ne: 'MONITOR' }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('sourceIp requestUrl requestMethod type severity aiAnalysis createdAt');
    
    if (recentAttacks.length > 0) {
      contextData += 'RECENT ATTACK REPORTS (Last 24 hours):\n';
      recentAttacks.forEach(attack => {
        contextData += `- ${attack.sourceIp} | ${attack.type} | ${attack.severity} | ${new Date(attack.createdAt).toLocaleString()}\n`;
        contextData += `  URL: ${attack.requestUrl} | Method: ${attack.requestMethod}\n`;
        if (attack.aiAnalysis) {
          contextData += `  Analysis: ${attack.aiAnalysis.substring(0, 200)}...\n`;
        }
        contextData += '\n';
      });
      contextData += '\n';
    }

    // 3. Specific attack details if attackId is provided
    if (attackId) {
      const attackDetails = await MaliciousRequest.findById(attackId);
      if (attackDetails) {
        contextData += 'SPECIFIC ATTACK DETAILS:\n';
        contextData += `ID: ${attackDetails._id}\n`;
        contextData += `Source IP: ${attackDetails.sourceIp}\n`;
        contextData += `Type: ${attackDetails.type} | Severity: ${attackDetails.severity}\n`;
        contextData += `URL: ${attackDetails.requestUrl}\n`;
        contextData += `Method: ${attackDetails.requestMethod}\n`;
        contextData += `Headers: ${JSON.stringify(attackDetails.requestHeaders, null, 2)}\n`;
        contextData += `Body: ${attackDetails.requestBody}\n`;
        contextData += `AI Analysis: ${attackDetails.aiAnalysis}\n`;
        contextData += `AI Recommendations: ${attackDetails.aiRecommendation}\n`;
        contextData += `Status: ${attackDetails.status}\n`;
        contextData += `Created: ${new Date(attackDetails.createdAt).toLocaleString()}\n\n`;
      }
    }

    // 4. System overview and statistics
    const systemStats = await getSystemStatistics();
    contextData += systemStats;

    // 5. Currently monitored IPs
    const monitoredIps = monitoringService.getMonitoredIps();
    if (monitoredIps.length > 0) {
      contextData += `CURRENTLY MONITORED IPs: ${monitoredIps.join(', ')}\n\n`;
    }

    // 6. System logs (if requested)
    if (includeSystemLogs) {
      const systemLogs = await getRecentSystemLogs();
      if (systemLogs) {
        contextData += systemLogs;
      }
    }

  } catch (error) {
    console.error('Error gathering security context:', error);
    contextData += 'Note: Some context data could not be retrieved due to system errors.\n';
  }

  return contextData;
};

// Get system statistics for context
const getSystemStatistics = async (): Promise<string> => {
  try {
    const totalReports = await MaliciousRequest.countDocuments();
    const activeMonitoring = await MaliciousRequest.countDocuments({
      requestMethod: 'MONITOR',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const criticalAlerts = await MaliciousRequest.countDocuments({
      severity: 'critical',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const highAlerts = await MaliciousRequest.countDocuments({
      severity: 'high',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const attackTypes = await MaliciousRequest.aggregate([
      { 
        $match: { 
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          requestMethod: { $ne: 'MONITOR' }
        } 
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    let stats = 'SYSTEM STATISTICS (Last 24 hours):\n';
    stats += `Total Reports: ${totalReports}\n`;
    stats += `Active Monitoring Events: ${activeMonitoring}\n`;
    stats += `Critical Alerts: ${criticalAlerts}\n`;
    stats += `High Severity Alerts: ${highAlerts}\n`;
    
    if (attackTypes.length > 0) {
      stats += 'Top Attack Types:\n';
      attackTypes.forEach(type => {
        stats += `  - ${type._id}: ${type.count} incidents\n`;
      });
    }
    stats += '\n';
    
    return stats;
  } catch (error) {
    console.error('Error getting system statistics:', error);
    return 'System statistics unavailable.\n\n';
  }
};

// Get recent system logs (implementation depends on your logging setup)
const getRecentSystemLogs = async (): Promise<string> => {
  try {
    // This is a basic implementation - you might want to integrate with actual system logs
    // For now, we'll return monitoring-related logs from our temp directory
    const tempDir = path.join(__dirname, '..', 'temp');
    let logData = 'RECENT SYSTEM ACTIVITY:\n';
    
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir)
        .filter(file => file.endsWith('.pcap'))
        .sort((a, b) => {
          const aStats = fs.statSync(path.join(tempDir, a));
          const bStats = fs.statSync(path.join(tempDir, b));
          return bStats.mtime.getTime() - aStats.mtime.getTime();
        })
        .slice(0, 5);
      
      if (files.length > 0) {
        logData += 'Recent capture files:\n';
        files.forEach(file => {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          logData += `  - ${file} (${(stats.size / 1024).toFixed(2)} KB, ${stats.mtime.toLocaleString()})\n`;
        });
      }
    }
    
    logData += '\n';
    return logData;
  } catch (error) {
    console.error('Error reading system logs:', error);
    return '';
  }
};
// Function to process messages with Groq LLM
const processWithGroq = async (messages: any[], contextData: string) => {
  try {
    const groq = new (await import('groq-sdk')).Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
    
    // Create enhanced system message with comprehensive security context
    const systemMessage = {
      role: 'system',
      content: `You are an advanced cybersecurity assistant with comprehensive access to security monitoring data, attack reports, and system logs. 
      
      Your capabilities include:
      - Analyzing network monitoring data and packet captures
      - Investigating security incidents and attacks
      - Providing detailed threat analysis and attack attribution
      - Recommending specific mitigation strategies and incident response actions
      - Correlating events across multiple data sources
      - Explaining attack techniques and attack vectors in detail
      
      You have access to real-time monitoring data, historical attack reports, system logs, and capture files.
      Always provide actionable, technical recommendations based on the available data.
      When analyzing attacks, include details about:
      - Attack vectors and techniques used
      - Potential impact and risk level
      - Specific steps for investigation and remediation
      - Prevention strategies for similar future attacks
      
      ${contextData ? 'Current security context and monitoring data:' : ''}
      ${contextData || ''}
      
      Be precise, technical, and comprehensive in your analysis. Prioritize security and provide specific, actionable guidance.`
    };
    
    // Add system message to the beginning of messages array
    const completionMessages = [systemMessage, ...messages];
    
    const completion = await groq.chat.completions.create({
      messages: completionMessages,
      model: "llama3-70b-8192",
      temperature: 0.3, // Lower temperature for more focused security analysis
      max_tokens: 4096, // Increased for more detailed responses
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error processing with Groq:', error);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
};

// Get detailed attack information for analysis
export const getAttackDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const attack = await MaliciousRequest.findById(id);
    if (!attack) {
      res.status(404).json({ message: 'Attack report not found' });
      return;
    }

    // Get related attacks from the same IP
    const relatedAttacks = await MaliciousRequest.find({
      sourceIp: attack.sourceIp,
      _id: { $ne: attack._id }
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // Get monitoring data for the IP if available
    const monitoringData = await MaliciousRequest.find({
      sourceIp: attack.sourceIp,
      requestMethod: 'MONITOR'
    })
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      attack,
      relatedAttacks,
      monitoringData,
      isCurrentlyMonitored: monitoringService.getMonitoredIps().includes(attack.sourceIp)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system security overview
export const getSecurityOverview = async (req: Request, res: Response) => {
  try {
    const contextData = await gatherSecurityContext(undefined, true);
    res.json({ overview: contextData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};