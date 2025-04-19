import axios from 'axios';
import { MaliciousRequestFormData, MaliciousRequest, MaliciousRequestsResponse, MaliciousRequestStats, ReportStatus } from '../types';

const API_URL = 'http://localhost:5000/api/reports';

// Report a new malicious request
export const reportMaliciousRequest = async (requestData: MaliciousRequestFormData) => {
  // Convert headers from string to object if needed
  const processedData = {
    ...requestData,
    requestHeaders: typeof requestData.requestHeaders === 'string' 
      ? JSON.parse(requestData.requestHeaders) 
      : requestData.requestHeaders
  };
  
  const response = await axios.post(API_URL, processedData);
  return response.data;
};

// Get all malicious requests with pagination and optional filters
export const getMaliciousRequests = async (
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: ReportStatus;
    severity?: string;
    type?: string;
  }
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  // Add any filters if they exist
  if (filters) {
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.type) params.append('type', filters.type);
  }

  const response = await axios.get(`${API_URL}?${params}`);
  return response.data as MaliciousRequestsResponse;
};

// Get a single malicious request by ID
export const getMaliciousRequestById = async (id: string) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data as MaliciousRequest;
};

// Update a malicious request status
export const updateMaliciousRequestStatus = async (
  id: string,
  status: ReportStatus,
  notes?: string
) => {
  const response = await axios.patch(`${API_URL}/${id}/status`, {
    status,
    notes
  });
  return response.data as MaliciousRequest;
};

// Get malicious request statistics
export const getMaliciousRequestStats = async () => {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data as MaliciousRequestStats;
};