import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import monitoringService from '../services/monitoringService';
import MaliciousRequest from '../models/MaliciousRequest';

// Start monitoring an IP address
export const startMonitoring = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { ip, interval } = req.body;
    
    // Validate IP address
    if (!monitoringService.isValidIpAddress(ip)) {
      res.status(400).json({ message: 'Invalid IP address' });
      return;
    }
    
    // Start monitoring
    monitoringService.startContinuousMonitoring(ip, interval || 5);
    
    res.json({ 
      message: `Started monitoring IP ${ip}`, 
      interval: interval || 5
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Stop monitoring an IP address
export const stopMonitoring = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { ip } = req.params;
    
    // Stop monitoring
    monitoringService.stopMonitoring(ip);
    
    res.json({ message: `Stopped monitoring IP ${ip}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all currently monitored IPs
export const getMonitoredIps = async (_req: Request, res: Response) => {
  try {
    const ips = monitoringService.getMonitoredIps();
    
    res.json({ ips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Run a one-time scan on an IP address
export const scanIp = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { ip } = req.params;
    
    // Validate IP address
    if (!monitoringService.isValidIpAddress(ip)) {
      res.status(400).json({ message: 'Invalid IP address' });
      return;
    }
    
    // Run scan
    const result = await monitoringService.monitorIp(ip);
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recent monitoring logs for a specific IP
export const getMonitoringLogs = async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    console.log(`Fetching monitoring logs for IP: ${ip}, page: ${page}, limit: ${limit}`);

    // Enhanced query to find monitoring logs more effectively
    const query = { 
      $or: [
        // Direct match on sourceIp
        { sourceIp: ip },
        // Match monitoring requests specifically
        { 
          requestMethod: 'MONITOR',
          requestUrl: { $regex: ip }
        },
        // Search in description for monitoring logs
        { 
          description: { $regex: ip },
          requestMethod: 'MONITOR'
        },
        // Search in request body for monitoring data
        { 
          requestBody: { $regex: ip },
          requestMethod: 'MONITOR'
        }
      ]
    };

    console.log('Query:', JSON.stringify(query));

    const logs = await MaliciousRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${logs.length} logs for IP ${ip}`);
    
    // Debug: Show what types of logs were found
    if (logs.length > 0) {
      const logTypes = logs.map(log => ({
        method: log.requestMethod,
        url: log.requestUrl,
        sourceIp: log.sourceIp,
        hasDescription: !!log.description
      }));
      console.log('Log types found:', JSON.stringify(logTypes, null, 2));
    }

    const total = await MaliciousRequest.countDocuments(query);

    res.json({
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching monitoring logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
};