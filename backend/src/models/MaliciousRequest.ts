import mongoose, { Document, Schema } from 'mongoose';

// Define the severity levels for malicious requests
export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Define the type of malicious request
export enum RequestType {
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  CSRF = 'csrf',
  DDOS = 'ddos',
  BRUTE_FORCE = 'brute_force',
  PORT_SCAN = 'port_scan',
  BACKDOOR = 'backdoor',
  MALWARE = 'malware',
  NETWORK_SCAN = 'network_scan',
  OTHER = 'other'
}

// Define the status of the report
export enum ReportStatus {
  NEW = 'new',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive'
}

// Interface for the MaliciousRequest document
export interface IMaliciousRequest extends Document {
  requestUrl: string;
  requestMethod: string;
  requestHeaders: Record<string, string>;
  requestBody: string;
  sourceIp: string;
  timestamp: Date;
  severity: SeverityLevel;
  type: RequestType;
  description: string;
  status: ReportStatus;
  aiAnalysis: string;
  aiRecommendation: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string[];
}

// Schema for malicious request
const MaliciousRequestSchema = new Schema<IMaliciousRequest>({
  requestUrl: { type: String, required: true },
  requestMethod: { type: String, required: true },
  requestHeaders: { type: Schema.Types.Mixed, default: {} },
  requestBody: { type: String, default: '' },
  sourceIp: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  severity: { 
    type: String, 
    enum: Object.values(SeverityLevel),
    default: SeverityLevel.MEDIUM 
  },
  type: { 
    type: String, 
    enum: Object.values(RequestType),
    default: RequestType.OTHER 
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: Object.values(ReportStatus),
    default: ReportStatus.NEW 
  },
  aiAnalysis: { type: String, default: '' },
  aiRecommendation: { type: String, default: '' },
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
  notes: [{ type: String }]
}, {
  timestamps: true
});

export default mongoose.model<IMaliciousRequest>('MaliciousRequest', MaliciousRequestSchema);