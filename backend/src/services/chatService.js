// src/services/chatService.js
import Conversation from '../models/Conversation.js';
import Message from '../models/Messages.js';

class ChatService {
  async createConversation(participants, title = 'New Chat') {
    try {
      const conversationId = `conv-${Date.now()}`;
      const conversation = new Conversation({
        conversationId,
        participants,
        title
      });

      await conversation.save();
      return conversation;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  async getConversationById(conversationId) {
    try {
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) throw new Error('Conversation not found');
      return conversation;
    } catch (error) {
      console.error('❌ Error fetching conversation:', error);
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }
  }

  async getMessagesByConversationId(conversationId) {
    try {
      return await Message.find({ conversation: conversationId }).sort({ timestamp: 1 });
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }

  async addMessage(conversationId, sender, content, messageType = 'user') {
    try {
      const message = new Message({
        conversation: conversationId,
        sender: sender.toLowerCase(), // normalize sender
        content,
        messageType
      });

      await message.save();

      await Conversation.findOneAndUpdate(
        { conversationId },
        { updatedAt: Date.now() }
      );

      return message;
    } catch (error) {
      console.error('❌ Error adding message:', error);
      throw new Error(`Failed to add message: ${error.message}`);
    }
  }

  async getUserConversations(userId) {
    try {
      return await Conversation.find({ participants: userId }).sort({ updatedAt: -1 });
    } catch (error) {
      console.error('❌ Error fetching user conversations:', error);
      throw new Error(`Failed to fetch user conversations: ${error.message}`);
    }
  }
}

export default new ChatService();
