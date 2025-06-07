import { Groq } from "groq-sdk";
import dotenv from 'dotenv';
import { SeverityLevel, RequestType } from '../models/MaliciousRequest';

dotenv.config();

interface AIAnalysisResult {
  severity: SeverityLevel;
  type: RequestType;
  analysis: string;
  recommendation: string;
}

class AIService {
  private groq: Groq;
  private systemPrompt: string;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });

    this.systemPrompt = `
You are an AI cybersecurity analyst tasked with analyzing network monitoring data for potential security threats.

Review the provided monitoring data carefully and create a detailed security analysis with the following components:
1. Threat severity classification: "low", "medium", "high", or "critical"
2. Threat type classification (choose the most appropriate):
   - "sql_injection"
   - "xss"
   - "csrf"
   - "ddos"
   - "brute_force"
   - "port_scan"
   - "backdoor"
   - "malware"
   - "network_scan" 
   - "other"
3. A brief but detailed analysis of the potential threat (2-3 sentences)
4. Specific security recommendations to address or mitigate the threat (2-3 points)

FORMAT YOUR RESPONSE AS JSON with the following structure:
{
  "severity": "low|medium|high|critical",
  "type": "one_of_the_threat_types_listed_above",
  "analysis": "Your detailed analysis here",
  "recommendation": "Your specific recommendations here"
}

When analyzing IP monitoring data, particularly focus on:
- Open port patterns that might indicate vulnerabilities
- Response times and packet loss that could suggest DoS attacks
- Traffic volume anomalies
- Connection attempt frequencies
- Port scanning patterns
- Known dangerous ports (e.g., 21, 22, 23, 25, etc.)
`;
  }

  /**
   * Analyze a potentially malicious request using Groq LLM
   */
  async analyzeMaliciousRequest(
    requestUrl: string,
    requestMethod: string,
    requestHeaders: Record<string, string>,
    requestBody: string,
    sourceIp: string
  ): Promise<AIAnalysisResult> {
    try {
      const isMonitoringData = requestMethod === 'MONITOR';

      // Create a prompt based on the data type
      let userPrompt: string;
      
      if (isMonitoringData) {
        // Format for IP monitoring data
        userPrompt = `
IP MONITORING DATA ANALYSIS REQUEST

Target IP: ${sourceIp}
Timestamp: ${new Date().toISOString()}

MONITORING DATA:
${requestBody}

Based on this IP monitoring data, provide a security analysis in the required JSON format.
`;
      } else {
        // Format for manual request data
        userPrompt = `
SUSPICIOUS HTTP REQUEST ANALYSIS REQUEST

URL: ${requestUrl}
Method: ${requestMethod}
Source IP: ${sourceIp}

Headers:
${JSON.stringify(requestHeaders, null, 2)}

Body:
${requestBody}

Based on this HTTP request data, provide a security analysis in the required JSON format.
`;
      }

      // Call Groq API
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "llama3-70b-8192",
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      });

      // Parse the response as JSON
      const responseText = completion.choices[0].message.content || "";
      const result: AIAnalysisResult = JSON.parse(responseText);
      
      // Validate and ensure correct format
      return {
        severity: this.validateSeverity(result.severity),
        type: this.validateType(result.type),
        analysis: result.analysis || "Analysis unavailable.",
        recommendation: result.recommendation || "No recommendations available."
      };
    } catch (error) {
      console.error('Error analyzing with Groq LLM:', error);
      
      // Return a fallback result in case of error
      return {
        severity: SeverityLevel.MEDIUM,
        type: RequestType.OTHER,
        analysis: 'Automated analysis failed. Manual review required.',
        recommendation: 'Please review this request manually as our automated analysis system encountered an error.'
      };
    }
  }

  /**
   * Validate severity level
   */
  private validateSeverity(severity: string): SeverityLevel {
    const validSeverities = [
      SeverityLevel.LOW, 
      SeverityLevel.MEDIUM, 
      SeverityLevel.HIGH, 
      SeverityLevel.CRITICAL
    ];
    
    // Convert string to enum
    let severityEnum: SeverityLevel;
    switch(severity.toLowerCase()) {
      case 'low':
        severityEnum = SeverityLevel.LOW;
        break;
      case 'medium':
        severityEnum = SeverityLevel.MEDIUM;
        break;
      case 'high':
        severityEnum = SeverityLevel.HIGH;
        break;
      case 'critical':
        severityEnum = SeverityLevel.CRITICAL;
        break;
      default:
        severityEnum = SeverityLevel.MEDIUM;
    }
    
    if (validSeverities.includes(severityEnum)) {
      return severityEnum;
    }
    
    // Default severity if invalid
    return SeverityLevel.MEDIUM;
  }

  /**
   * Validate request type
   */
  private validateType(type: string): RequestType {
    // Convert string to enum using the updated RequestType enum that includes all threat types
    switch(type.toLowerCase()) {
      case 'sql_injection':
        return RequestType.SQL_INJECTION;
      case 'xss':
        return RequestType.XSS;
      case 'csrf':
        return RequestType.CSRF;
      case 'ddos':
        return RequestType.DDOS;
      case 'brute_force':
        return RequestType.BRUTE_FORCE;
      // Now we can properly map these types to their enum values
      case 'port_scan':
        return RequestType.PORT_SCAN;
      case 'backdoor':
        return RequestType.BACKDOOR;
      case 'malware':
        return RequestType.MALWARE;
      case 'network_scan':
        return RequestType.NETWORK_SCAN;
      default:
        return RequestType.OTHER;
    }
  }
  
  /**
   * Prepare monitoring data for chatbot context
   */
  async prepareMonitoringDataForChatbot(monitoringLogs: any[]): Promise<string> {
    // Extract key information from monitoring logs to provide context to the chatbot
    const summary = monitoringLogs.slice(0, 10).map(log => {
      let logSummary = `IP: ${log.sourceIp}\n`;
      logSummary += `Timestamp: ${new Date(log.createdAt).toLocaleString()}\n`;
      logSummary += `Severity: ${log.severity} | Type: ${log.type}\n`;
      
      if (log.aiAnalysis) {
        logSummary += `Analysis: ${log.aiAnalysis}\n`;
      }
      
      if (log.aiRecommendation) {
        logSummary += `Recommendations: ${log.aiRecommendation}\n`;
      }
      
      // Parse monitoring data from requestBody if available
      if (log.requestBody) {
        try {
          const monitoringData = JSON.parse(log.requestBody);
          if (monitoringData.trafficStats) {
            logSummary += `Traffic: ${monitoringData.trafficStats.packetsPerSecond?.toFixed(2)} pps, `;
            logSummary += `${(monitoringData.trafficStats.bytesPerSecond / 1024)?.toFixed(2)} KB/s\n`;
            logSummary += `Sources: ${monitoringData.trafficStats.uniqueSources?.length || 0}, `;
            logSummary += `Connections: ${monitoringData.trafficStats.connectionAttempts || 0}\n`;
          }
          
          if (monitoringData.anomalies && monitoringData.anomalies.length > 0) {
            logSummary += `Anomalies: ${monitoringData.anomalies.join('; ')}\n`;
          }
        } catch (e) {
          // If parsing fails, just include raw data summary
          logSummary += `Raw monitoring data available (${log.requestBody.length} chars)\n`;
        }
      }
      
      return logSummary;
    }).join('\n---\n');
    
    return `MONITORING DATA ANALYSIS:\n${summary}\n`;
  }

  /**
   * Prepare comprehensive attack context for chatbot
   */
  async prepareAttackContextForChatbot(attack: any, relatedAttacks: any[] = [], monitoringData: any[] = []): Promise<string> {
    let context = `ATTACK ANALYSIS CONTEXT:\n\n`;
    
    // Main attack details
    context += `PRIMARY ATTACK:\n`;
    context += `ID: ${attack._id}\n`;
    context += `Source IP: ${attack.sourceIp}\n`;
    context += `Target: ${attack.requestUrl}\n`;
    context += `Method: ${attack.requestMethod}\n`;
    context += `Attack Type: ${attack.type}\n`;
    context += `Severity: ${attack.severity}\n`;
    context += `Status: ${attack.status}\n`;
    context += `Timestamp: ${new Date(attack.createdAt).toLocaleString()}\n`;
    
    if (attack.requestHeaders && Object.keys(attack.requestHeaders).length > 0) {
      context += `Headers: ${JSON.stringify(attack.requestHeaders, null, 2)}\n`;
    }
    
    if (attack.requestBody) {
      context += `Payload: ${attack.requestBody.substring(0, 500)}${attack.requestBody.length > 500 ? '...' : ''}\n`;
    }
    
    if (attack.aiAnalysis) {
      context += `AI Analysis: ${attack.aiAnalysis}\n`;
    }
    
    if (attack.aiRecommendation) {
      context += `AI Recommendations: ${attack.aiRecommendation}\n`;
    }
    
    // Related attacks from same source
    if (relatedAttacks.length > 0) {
      context += `\nRELATED ATTACKS FROM ${attack.sourceIp}:\n`;
      relatedAttacks.slice(0, 5).forEach((related, index) => {
        context += `${index + 1}. ${related.type} | ${related.severity} | ${new Date(related.createdAt).toLocaleString()}\n`;
        context += `   URL: ${related.requestUrl}\n`;
        if (related.aiAnalysis) {
          context += `   Analysis: ${related.aiAnalysis.substring(0, 200)}...\n`;
        }
      });
    }
    
    // Monitoring data for the IP
    if (monitoringData.length > 0) {
      context += `\nMONITORING DATA FOR ${attack.sourceIp}:\n`;
      const monitoringContext = await this.prepareMonitoringDataForChatbot(monitoringData);
      context += monitoringContext;
    }
    
    return context;
  }
}

export default new AIService();