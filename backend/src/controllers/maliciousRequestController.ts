import { Request, Response } from 'express';
import MaliciousRequest, { ReportStatus } from '../models/MaliciousRequest';
import aiService from '../services/aiService';
import { validationResult } from 'express-validator';

// Report a new malicious request
export const reportMaliciousRequest = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { 
      requestUrl, 
      requestMethod, 
      requestHeaders, 
      requestBody, 
      sourceIp, 
      description 
    } = req.body;

    // Use AI service to analyze the request
    const aiAnalysisResult = await aiService.analyzeMaliciousRequest(
      requestUrl,
      requestMethod,
      requestHeaders,
      requestBody,
      sourceIp
    );

    // Create a new malicious request report
    const maliciousRequest = new MaliciousRequest({
      requestUrl,
      requestMethod,
      requestHeaders,
      requestBody,
      sourceIp,
      description,
      severity: aiAnalysisResult.severity,
      type: aiAnalysisResult.type,
      aiAnalysis: aiAnalysisResult.analysis,
      aiRecommendation: Array.isArray(aiAnalysisResult.recommendation)
        ? aiAnalysisResult.recommendation.join("\n")
        : String(aiAnalysisResult.recommendation),
      status: ReportStatus.NEW
    });

    // Save to database
    await maliciousRequest.save();

    res.status(201).json(maliciousRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all malicious request reports
export const getAllMaliciousRequests = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Optional filters
    const filter: any = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.severity) {
      filter.severity = req.query.severity;
    }
    
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Get malicious requests with pagination
    const maliciousRequests = await MaliciousRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await MaliciousRequest.countDocuments(filter);

    res.json({
      maliciousRequests,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single malicious request report by ID
export const getMaliciousRequestById = async (req: Request, res: Response) => {
  try {
    const maliciousRequest = await MaliciousRequest.findById(req.params.id);
    
    if (!maliciousRequest) {
      res.status(404).json({ message: 'Malicious request report not found' });
      return;
    }

    res.json(maliciousRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a malicious request report status
export const updateMaliciousRequestStatus = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    
    // Ensure valid status
    if (!Object.values(ReportStatus).includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    // Find the report
    const maliciousRequest = await MaliciousRequest.findById(req.params.id);
    
    if (!maliciousRequest) {
      res.status(404).json({ message: 'Malicious request report not found' });
      return;
    }

    // Update fields
    maliciousRequest.status = status;
    
    // Add note if provided
    if (notes) {
      if (!maliciousRequest.notes) {
        maliciousRequest.notes = [];
      }
      maliciousRequest.notes.push(notes);
    }

    // If status is resolved, add resolution info
    if (status === ReportStatus.RESOLVED && req.user) {
      maliciousRequest.resolvedBy = req.user.id;
      maliciousRequest.resolvedAt = new Date();
    }

    await maliciousRequest.save();

    res.json(maliciousRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get summary statistics of malicious requests
export const getMaliciousRequestStats = async (_req: Request, res: Response) => {
  try {
    // Get counts by status
    const statusCounts = await MaliciousRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get counts by type
    const typeCounts = await MaliciousRequest.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get counts by severity
    const severityCounts = await MaliciousRequest.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Get counts by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyCounts = await MaliciousRequest.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      statusCounts,
      typeCounts,
      severityCounts,
      dailyCounts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};