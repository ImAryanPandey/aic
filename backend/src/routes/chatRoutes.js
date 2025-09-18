import express from 'express';
import chatController from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/conversations', protect, chatController.createConversation);
router.get('/conversations/:conversationId', protect, chatController.getConversation);
router.get('/users/:userId/conversations', protect, chatController.getUserConversations);


router.get('/conversations/:conversationId/messages', protect, chatController.getMessages);
router.post('/messages', protect, chatController.addMessage);

export default router;
