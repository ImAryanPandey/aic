import Groq from "groq-sdk";
import redisService from './redisService.js';
import chatService from './chatService.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log('🤖 AI Service initialized with Groq');

class AIService {
  async generateResponse(conversationId, message, userId) {
    console.log(`🔄 Generating AI response for conversation ${conversationId}`);
    
    try {
      // Get conversation history
      const conversationHistory = await this.getConversationHistory(conversationId);
      
      // Get context
      const context = await redisService.getConversationContext(conversationId) || {
        systemPrompt: "You are a helpful AI assistant. Be friendly, professional, and concise.",
        lastTopic: null
      };
      
      // Generate response
      const response = await this.callGroqAPI(message, conversationHistory, context);
      
      // Save to database
      await chatService.addMessage(conversationId, 'AI', response, 'ai');
      
      // Update context
      await this.updateContext(conversationId, message, response);
      
      console.log(`✅ AI response generated: ${response.substring(0, 100)}...`);
      return response;
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async getConversationHistory(conversationId) {
    try {
      // Check cache first
      const cachedHistory = await redisService.get(`conversation:${conversationId}:history`);
      if (cachedHistory) {
        console.log(`📚 Using cached history for conversation ${conversationId}`);
        return cachedHistory;
      }
      
      // Get from database
      const messages = await chatService.getMessagesByConversationId(conversationId);
      const history = messages.map(msg => ({
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Cache for 5 minutes
      await redisService.set(`conversation:${conversationId}:history`, history, 300);
      
      console.log(`📝 Retrieved and cached ${history.length} messages`);
      return history;
    } catch (error) {
      console.error('❌ Error getting conversation history:', error);
      return [];
    }
  }

  async callGroqAPI(message, history, context) {
    console.log('🌐 Calling Groq API...');
    
    try {
      // Check cache
      const cachedResponse = await redisService.getCachedAIResponse(message);
      if (cachedResponse) {
        console.log('💾 Using cached AI response');
        return cachedResponse;
      }
      
      // Prepare messages
      const messages = [
        { role: "system", content: context.systemPrompt },
        ...history.slice(-10),
        { role: "user", content: message }
      ];
      
      console.log(`📤 Sending request to Groq with ${messages.length} messages`);
      
      // Call Groq
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      });
      
      const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      
      console.log(`🎯 Groq API response: ${response.substring(0, 100)}...`);
      
      // Cache response
      await redisService.cacheAIResponse(message, response);
      
      return response;
    } catch (error) {
      console.error('❌ Error calling Groq API:', error);
      throw new Error('Failed to get AI response');
    }
  }

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

  async extractTopic(message) {
    const words = message.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could'];
    
    const keywords = words.filter(word => word.length > 3 && !stopWords.includes(word));
    
    return keywords.length > 0 ? keywords[0] : 'general';
  }
}

export default new AIService();