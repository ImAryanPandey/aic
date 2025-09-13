import express from 'express';
import chatController from '../controllers/chatController.js';

const router = express.Router();

// Conversation routes
router.post('/conversations', chatController.createConversation);
router.get('/conversations/:conversationId', chatController.getConversation);
router.get('/users/:userId/conversations', chatController.getUserConversations);

// Message routes
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/messages', chatController.addMessage);

export default router;