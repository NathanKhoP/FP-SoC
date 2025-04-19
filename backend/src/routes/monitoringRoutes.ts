import express from 'express';
import { body, param } from 'express-validator';
import { 
  startMonitoring,
  stopMonitoring,
  getMonitoredIps,
  scanIp,
  getMonitoringLogs
} from '../controllers/monitoringController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// @route   POST /api/monitor
// @desc    Start monitoring an IP address
// @access  Private (analyst and admin only)
router.post(
  '/',
  [
    authenticate,
    authorize([UserRole.ANALYST, UserRole.ADMIN]),
    body('ip').notEmpty().withMessage('IP address is required'),
    body('interval').optional().isInt({ min: 1 }).withMessage('Interval must be a positive integer')
  ],
  startMonitoring
);

// @route   DELETE /api/monitor/:ip
// @desc    Stop monitoring an IP address
// @access  Private (analyst and admin only)
router.delete(
  '/:ip',
  [
    authenticate,
    authorize([UserRole.ANALYST, UserRole.ADMIN]),
    param('ip').notEmpty().withMessage('IP address is required')
  ],
  stopMonitoring
);

// @route   GET /api/monitor
// @desc    Get all monitored IP addresses
// @access  Private (analyst and admin only)
router.get(
  '/',
  [
    authenticate,
    authorize([UserRole.ANALYST, UserRole.ADMIN])
  ],
  getMonitoredIps
);

// @route   GET /api/monitor/:ip/scan
// @desc    Run a one-time scan on an IP address
// @access  Private (analyst and admin only)
router.get(
  '/:ip/scan',
  [
    authenticate,
    authorize([UserRole.ANALYST, UserRole.ADMIN]),
    param('ip').notEmpty().withMessage('IP address is required')
  ],
  scanIp
);

// @route   GET /api/monitor/:ip/logs
// @desc    Get logs for a monitored IP address
// @access  Private (analyst and admin only)
router.get(
  '/:ip/logs',
  [
    authenticate,
    authorize([UserRole.ANALYST, UserRole.ADMIN]),
    param('ip').notEmpty().withMessage('IP address is required')
  ],
  getMonitoringLogs
);

export default router;