import express from 'express';
import { body, param } from 'express-validator';
import { 
  processMessage, 
  getAttackDetails, 
  getSecurityOverview 
} from '../controllers/chatbotController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// @route   POST /api/chatbot/message
// @desc    Process a chatbot message with enhanced context
// @access  Public
router.post(
  '/message',
  [
    body('messages').isArray().withMessage('Messages must be an array'),
    body('messages.*.role').isIn(['user', 'assistant']).withMessage('Message role must be user or assistant'),
    body('messages.*.content').isString().withMessage('Message content must be a string'),
    body('ipContext').optional().isString().withMessage('IP context must be a string'),
    body('includeSystemLogs').optional().isBoolean().withMessage('includeSystemLogs must be a boolean'),
    body('attackId').optional().isString().withMessage('Attack ID must be a string')
  ],
  processMessage
);

// @route   GET /api/chatbot/attack/:id
// @desc    Get detailed attack information for chatbot analysis
// @access  Private (authenticated users)
router.get(
  '/attack/:id',
  [
    authenticate,
    param('id').isMongoId().withMessage('Invalid attack ID')
  ],
  getAttackDetails
);

// @route   GET /api/chatbot/overview
// @desc    Get comprehensive security overview for chatbot context
// @access  Private (analyst and admin only)
router.get(
  '/overview',
  [
    authenticate,
    authorize([UserRole.ANALYST, UserRole.ADMIN])
  ],
  getSecurityOverview
);

export default router;