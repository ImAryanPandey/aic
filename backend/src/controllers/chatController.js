import chatService from '../services/chatService.js';
import { addAIJob } from '../services/queueService.js';

class ChatController {
  // Create a new conversation
  async createConversation(req, res) {
    try {
      const { participants, title } = req.body;
      
      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ 
          message: 'Participants are required and must be an array' 
        });
      }
      
      const conversation = await chatService.createConversation(participants, title);
      
      res.status(201).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get conversation by ID
  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;
      
      const conversation = await chatService.getConversationById(conversationId);
      
      res.status(200).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get messages for a conversation
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      
      const messages = await chatService.getMessagesByConversationId(conversationId);
      
      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add a new message and get AI response
  async addMessage(req, res) {
    try {
      const { conversationId, sender, content, messageType = 'user' } = req.body;
      
      if (!conversationId || !sender || !content) {
        return res.status(400).json({ 
          message: 'Conversation ID, sender, and content are required' 
        });
      }
      
      // Save user message
      const userMessage = await chatService.addMessage(
        conversationId, 
        sender, 
        content, 
        messageType
      );
      
      // Add AI processing job to queue
      const jobId = await addAIJob({
        conversationId,
        message: content,
        userId: sender
      });
      
      res.status(201).json({
        success: true,
        data: {
          userMessage,
          jobId,
          message: "Message sent and AI response is being processed"
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user conversations
  async getUserConversations(req, res) {
    try {
      const { userId } = req.params;
      
      const conversations = await chatService.getUserConversations(userId);
      
      res.status(200).json({
        success: true,
        data: conversations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new ChatController();