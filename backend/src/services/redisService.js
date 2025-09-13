import redisClient from '../../config/redis.js';

class RedisService {
  // Set a key-value pair with optional expiration (in seconds)
  async set(key, value, expireInSeconds) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (expireInSeconds) {
        await redisClient.set(key, stringValue, { EX: expireInSeconds });
      } else {
        await redisClient.set(key, stringValue);
      }
      
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  // Get value by key
  async get(key) {
    try {
      const value = await redisClient.get(key);
      
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch (e) {
        return value; // Return as string if not JSON
      }
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Delete a key
  async delete(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Set expiration for a key
  async expire(key, seconds) {
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  // Get all keys matching a pattern
  async keys(pattern) {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  // Store conversation context
  async setConversationContext(conversationId, context) {
    const key = `conversation:${conversationId}:context`;
    return await this.set(key, context, 3600); // Expire in 1 hour
  }

  // Get conversation context
  async getConversationContext(conversationId) {
    const key = `conversation:${conversationId}:context`;
    return await this.get(key);
  }

  // Store user session
  async setUserSession(userId, sessionData) {
    const key = `user:${userId}:session`;
    return await this.set(key, sessionData, 86400); // Expire in 24 hours
  }

  // Get user session
  async getUserSession(userId) {
    const key = `user:${userId}:session`;
    return await this.get(key);
  }

  // Cache AI response
  async cacheAIResponse(query, response) {
    // Create a hash of the query to use as key
    const key = `ai:response:${this.hashString(query)}`;
    return await this.set(key, response, 1800); // Expire in 30 minutes
  }

  // Get cached AI response
  async getCachedAIResponse(query) {
    const key = `ai:response:${this.hashString(query)}`;
    return await this.get(key);
  }

  // Simple hash function for creating consistent keys
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }
}

export default new RedisService();