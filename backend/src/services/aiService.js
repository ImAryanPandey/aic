import { GoogleGenerativeAI } from '@google/generative-ai';
import redisService from './redisService.js';
import chatService from './chatService.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  // Generate AI response for a user message
  async generateResponse(conversationId, message, userId) {
    try {
      // Get conversation history for context
      const conversationHistory = await this.getConversationHistory(conversationId);
      
      // Get or create conversation context
      let context = await redisService.getConversationContext(conversationId);
      if (!context) {
        context = {
          systemPrompt: "You are a helpful AI assistant. Be friendly, professional, and concise.",
          lastTopic: null
        };
      }
      
      // Generate response using Gemini
      const response = await this.callGeminiAPI(message, conversationHistory, context);
      
      // Save AI response to database
      await chatService.addMessage(conversationId, 'AI', response, 'ai');
      
      // Update conversation context
      await this.updateContext(conversationId, message, response);
      
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Get conversation history for context
  async getConversationHistory(conversationId) {
    try {
      // First check if history is cached in Redis
      const cachedHistory = await redisService.get(`conversation:${conversationId}:history`);
      if (cachedHistory) {
        return cachedHistory;
      }
      
      // If not cached, get from MongoDB
      const messages = await chatService.getMessagesByConversationId(conversationId);
      
      // Format for AI consumption
      const history = messages.map(msg => ({
        role: msg.messageType === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Cache in Redis for 5 minutes
      await redisService.set(`conversation:${conversationId}:history`, history, 300);
      
      return history;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  // Call Gemini API
  async callGeminiAPI(message, history, context) {
    try {
      // Check for cached response first
      const cachedResponse = await redisService.getCachedAIResponse(message);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Get the model
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Start a chat with history
      const chat = model.startChat({
        history: history,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });
      
      // Generate response
      const result = await chat.sendMessage(message);
      const response = result.response.text();
      
      // Cache the response
      await redisService.cacheAIResponse(message, response);
      
      return response;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to get AI response');
    }
  }

  // Update conversation context
  async updateContext(conversationId, userMessage, aiResponse) {
    try {
      // Extract potential topic from conversation
      const topic = await this.extractTopic(userMessage);
      
      const context = {
        systemPrompt: "You are a helpful AI assistant. Be friendly, professional, and concise.",
        lastTopic: topic,
        lastUpdated: new Date().toISOString()
      };
      
      // Save to Redis
      await redisService.setConversationContext(conversationId, context);
    } catch (error) {
      console.error('Error updating context:', error);
    }
  }

  // Extract topic from message (simplified implementation)
  async extractTopic(message) {
    // In a real implementation, this could use NLP techniques
    // For now, we'll just return a simple keyword extraction
    const words = message.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could'];
    
    const keywords = words.filter(word => 
      word.length > 3 && !stopWords.includes(word)
    );
    
    return keywords.length > 0 ? keywords[0] : 'general';
  }

  // RAG Implementation: Enhance AI response with retrieved information
  async enhanceWithRAG(conversationId, message) {
    try {
      // In a full RAG implementation, this would:
      // 1. Convert the user message to an embedding
      // 2. Search for similar documents in a vector database
      // 3. Retrieve relevant information
      // 4. Add that information to the context
      
      // For this simplified version, we'll just retrieve recent conversation history
      const history = await this.getConversationHistory(conversationId);
      
      // Extract relevant context from history
      const relevantContext = history
        .slice(-5) // Get last 5 messages
        .map(msg => `${msg.role}: ${msg.parts[0].text}`)
        .join('\n');
      
      return relevantContext;
    } catch (error) {
      console.error('Error in RAG implementation:', error);
      return '';
    }
  }
}

export default new AIService();