// src/services/redisService.js
import redisClient from '../../config/redis.js';

class RedisService {
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

  async get(key) {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async delete(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async expire(key, seconds) {
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  async keys(pattern) {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async setConversationContext(conversationId, context) {
    return await this.set(`conversation:${conversationId}:context`, context, 3600);
  }

  async getConversationContext(conversationId) {
    return await this.get(`conversation:${conversationId}:context`);
  }

  async setUserSession(userId, sessionData) {
    return await this.set(`user:${userId}:session`, sessionData, 86400);
  }

  async getUserSession(userId) {
    return await this.get(`user:${userId}:session`);
  }

  async cacheAIResponse(query, response) {
    const key = `ai:response:${this.hashString(query)}`;
    return await this.set(key, response, 1800);
  }

  async getCachedAIResponse(query) {
    return await this.get(`ai:response:${this.hashString(query)}`);
  }

  async appendToHistory(conversationId, role, content) {
    const key = `conversation:${conversationId}:history`;
    let history = (await this.get(key)) || [];
    history = [...history, { role, content }];
    await this.set(key, history, 300);
    return history;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash;
    }
    return Math.abs(hash).toString();
  }
}

export default new RedisService();
