// src/services/aiService.js
import Groq from "groq-sdk";
import redisService from './redisService.js';
import chatService from './chatService.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log('🤖 AI Service initialized with Groq');

class AIService {
  /**
   * Main entrypoint for generating an AI response
   */
  async generateResponse(conversationId, message, userId) {
    console.log(`🔄 Generating AI response for conversation ${conversationId}`);

    try {
      // Get conversation history
      const conversationHistory = await this.getConversationHistory(conversationId);

      // Get conversation context
      const context = (await redisService.getConversationContext(conversationId)) || {
        systemPrompt: "You are a helpful AI assistant. Be friendly, professional, and concise.",
        lastTopic: null
      };

      // Call LLM
      const response = await this.callGroqAPI(message, conversationHistory, context);

      // Persist AI response → database
      const savedMessage = await chatService.addMessage(
        conversationId,
        'ai',        // normalized to lowercase
        response,
        'ai'
      );

      // Refresh cache/context
      await this.updateContext(conversationId, message, response);

      // Append to Redis history
      await redisService.appendToHistory(conversationId, "user", message);
      await redisService.appendToHistory(conversationId, "assistant", response);

      console.log(`✅ AI response persisted & cached: ${response.substring(0, 100)}...`);
      return savedMessage.content;
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Get conversation history (from Redis first, fallback to DB)
   */
  async getConversationHistory(conversationId) {
    try {
      const cacheKey = `conversation:${conversationId}:history`;

      // Check Redis cache
      const cachedHistory = await redisService.get(cacheKey);
      if (cachedHistory) {
        console.log(`📚 Using cached history for conversation ${conversationId}`);
        return cachedHistory;
      }

      // Fetch from DB if cache missed
      const messages = await chatService.getMessagesByConversationId(conversationId);
      const history = messages.map(msg => ({
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Cache for 5 minutes
      await redisService.set(cacheKey, history, 300);

      console.log(`📝 Retrieved & cached ${history.length} messages`);
      return history;
    } catch (error) {
      console.error('❌ Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Call Groq API for completion
   */
  async callGroqAPI(message, history, context) {
    console.log('🌐 Calling Groq API...');

    try {
      // Check response cache
      const cachedResponse = await redisService.getCachedAIResponse(message);
      if (cachedResponse) {
        console.log('💾 Using cached AI response');
        return cachedResponse;
      }

      // Compose messages
      const messages = [
        { role: "system", content: context.systemPrompt },
        ...history.slice(-10), // limit context size
        { role: "user", content: message }
      ];

      console.log(`📤 Sending ${messages.length} messages to Groq`);

      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      });

      const response = completion.choices[0]?.message?.content || 
        "I'm sorry, I couldn't generate a response.";

      console.log(`🎯 Groq API response: ${response.substring(0, 100)}...`);

      // Cache response
      await redisService.cacheAIResponse(message, response);

      return response;
    } catch (error) {
      console.error('❌ Error calling Groq API:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Update Redis context for a conversation
   */
  async updateContext(conversationId, userMessage, aiResponse) {
    try {
      const topic = await this.extractTopic(userMessage);

      const context = {
        systemPrompt: "You are a helpful AI assistant. Be friendly, professional, and concise.",
        lastTopic: topic,
        lastUpdated: new Date().toISOString()
      };

      await redisService.setConversationContext(conversationId, context);

      console.log(`🔄 Updated context for conversation ${conversationId}`);
    } catch (error) {
      console.error('❌ Error updating context:', error);
    }
  }

  /**
   * Extracts a simple topic keyword from user message
   */
  async extractTopic(message) {
    const words = message.toLowerCase().split(/\s+/);
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are',
      'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'shall', 'should', 'may',
      'might', 'must', 'can', 'could'
    ];

    const keywords = words.filter(
      word => word.length > 3 && !stopWords.includes(word)
    );

    return keywords.length > 0 ? keywords[0] : 'general';
  }
}

export default new AIService();
