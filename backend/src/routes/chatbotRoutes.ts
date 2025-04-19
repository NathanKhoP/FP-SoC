import express from 'express';
import { body } from 'express-validator';
import { processMessage } from '../controllers/chatbotController';

const router = express.Router();

// @route   POST /api/chatbot/message
// @desc    Process a chatbot message
// @access  Public
router.post(
  '/message',
  [
    body('messages').isArray().withMessage('Messages must be an array'),
    body('messages.*.role').isIn(['user', 'assistant']).withMessage('Message role must be user or assistant'),
    body('messages.*.content').isString().withMessage('Message content must be a string')
  ],
  processMessage
);

export default router;