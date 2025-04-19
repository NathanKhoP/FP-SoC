import express from 'express';
import { body } from 'express-validator';
import { 
  reportMaliciousRequest, 
  getAllMaliciousRequests, 
  getMaliciousRequestById,
  updateMaliciousRequestStatus,
  getMaliciousRequestStats 
} from '../controllers/maliciousRequestController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// @route   POST /api/reports
// @desc    Report a new malicious request
// @access  Public (but could be protected in production)
router.post(
  '/',
  [
    body('requestUrl').notEmpty().withMessage('Request URL is required'),
    body('requestMethod').notEmpty().withMessage('Request method is required'),
    body('sourceIp').notEmpty().withMessage('Source IP is required'),
    body('description').notEmpty().withMessage('Description is required')
  ],
  reportMaliciousRequest
);

// @route   GET /api/reports
// @desc    Get all malicious request reports with pagination and filtering
// @access  Private (analyst and admin only)
router.get(
  '/',
  authenticate,
  authorize([UserRole.ANALYST, UserRole.ADMIN]), 
  getAllMaliciousRequests
);

// @route   GET /api/reports/:id
// @desc    Get a single malicious request report by ID
// @access  Private (analyst and admin only)
router.get(
  '/:id',
  authenticate,
  authorize([UserRole.ANALYST, UserRole.ADMIN]), 
  getMaliciousRequestById
);

// @route   PATCH /api/reports/:id/status
// @desc    Update a malicious request report status
// @access  Private (analyst and admin only)
router.patch(
  '/:id/status',
  [
    authenticate,
    authorize([UserRole.ANALYST, UserRole.ADMIN]),
    body('status').notEmpty().withMessage('Status is required')
  ],
  updateMaliciousRequestStatus
);

// @route   GET /api/reports/stats
// @desc    Get summary statistics of malicious requests
// @access  Private (analyst and admin only)
router.get(
  '/stats',
  authenticate,
  authorize([UserRole.ANALYST, UserRole.ADMIN]), 
  getMaliciousRequestStats
);

export default router;