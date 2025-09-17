import { Worker } from 'bullmq';
import aiService from '../services/aiService.js';
import { createClient } from 'redis';
import { io } from '../socketInstance.js';

console.log('Initializing AI Worker...');

// Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 30000),
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000,
  },
});

redisClient.on('error', (err) => {
  console.error('Worker Redis error:', err);
});

redisClient.connect().catch((err) => {
  console.error('Worker Redis connection failed:', err);
});

// Worker
const aiWorker = new Worker(
  'ai-queue',
  async (job) => {
    console.log(`Processing job ${job.id}:`, job.data);

    const { conversationId, message, userId } = job.data;

    try {
      const aiResponse = await aiService.generateResponse(conversationId, message, userId);

      console.log(`✅ AI response generated for job ${job.id}`);

      io.to(conversationId).emit('messageReceived', {
        conversationId,
        sender: 'AI',
        content: aiResponse,
        messageType: 'ai',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error in job ${job.id}:`, error);

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 18908,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
    },
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 15000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
    drainDelay: 5,
  }
);

aiWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed with result:`, job.returnvalue);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});

aiWorker.on('error', (err) => {
  console.error('❌ AI Worker error:', err);
});

console.log('✅ AI Worker ready');

export default aiWorker;
