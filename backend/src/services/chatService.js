import Conversation from '../models/Conversation.js';
import Message from '../models/Messages.js';

class ChatService {
  // Create a new conversation
  async createConversation(participants, title = 'New Conversation') {
    try {
      const conversation = new Conversation({
        participants,
        title
      });
      
      await conversation.save();
      return conversation;
    } catch (error) {
      throw new Error(`Error creating conversation: ${error.message}`);
    }
  }

  // Get conversation by ID
  async getConversationById(conversationId) {
    try {
      const conversation = await Conversation.findById(conversationId)
        .populate('participants', 'username email');
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      return conversation;
    } catch (error) {
      throw new Error(`Error fetching conversation: ${error.message}`);
    }
  }

  // Get all messages in a conversation
  async getMessagesByConversationId(conversationId) {
    try {
      const messages = await Message.find({ conversation: conversationId })
        .sort({ timestamp: 1 });
      
      return messages;
    } catch (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }
  }

  // Add a new message to a conversation
  async addMessage(conversationId, sender, content, messageType = 'user') {
    try {
      const message = new Message({
        conversation: conversationId,
        sender,
        content,
        messageType
      });
      
      await message.save();
      
      // Update the conversation's updatedAt field
      await Conversation.findByIdAndUpdate(conversationId, {
        updatedAt: Date.now()
      });
      
      return message;
    } catch (error) {
      throw new Error(`Error adding message: ${error.message}`);
    }
  }

  // Get all conversations for a user
  async getUserConversations(userId) {
    try {
      const conversations = await Conversation.find({
        participants: userId
      })
        .populate('participants', 'username email')
        .sort({ updatedAt: -1 });
      
      return conversations;
    } catch (error) {
      throw new Error(`Error fetching user conversations: ${error.message}`);
    }
  }
}

export default new ChatService();