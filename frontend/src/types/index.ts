// User related types
export enum UserRole {
  USER = 'user',
  ANALYST = 'analyst',
  ADMIN = 'admin'
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Malicious request related types
export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RequestType {
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  CSRF = 'csrf',
  DDOS = 'ddos',
  BRUTE_FORCE = 'brute_force',
  OTHER = 'other'
}

export enum ReportStatus {
  NEW = 'new',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive'
}

export interface MaliciousRequest {
  _id: string;
  requestUrl: string;
  requestMethod: string;
  requestHeaders: Record<string, string>;
  requestBody: string;
  sourceIp: string;
  timestamp: string;
  severity: SeverityLevel;
  type: RequestType;
  description: string;
  status: ReportStatus;
  aiAnalysis: string;
  aiRecommendation: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MaliciousRequestFormData {
  requestUrl: string;
  requestMethod: string;
  requestHeaders: string;
  requestBody: string;
  sourceIp: string;
  description: string;
}

export interface MaliciousRequestsResponse {
  maliciousRequests: MaliciousRequest[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface MaliciousRequestStats {
  statusCounts: Array<{ _id: ReportStatus; count: number }>;
  typeCounts: Array<{ _id: RequestType; count: number }>;
  severityCounts: Array<{ _id: SeverityLevel; count: number }>;
  dailyCounts: Array<{ _id: string; count: number }>;
}

// Chatbot related types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}