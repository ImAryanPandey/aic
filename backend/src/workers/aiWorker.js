import { Worker } from 'bullmq';
import aiService from '../services/aiService.js';
import { createClient } from 'redis';
import path from 'path';
import { config } from 'dotenv';
import connectDB from '../config/db.js';

const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

console.log('🤖 Initializing AI Worker...');

// Connect MongoDB
await connectDB();
console.log('✅ MongoDB connected for AI Worker');

// Redis client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 30000),
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000
  }
});

redisClient.on('error', (err) => {
  console.error('❌ Worker Redis client error:', err);
});

await redisClient.connect().then(() => {
  console.log('✅ Redis connected for AI Worker');
}).catch(err => {
  console.error('❌ Worker failed to connect to Redis:', err);
});

// Create a worker with BullMQ
const aiWorker = new Worker(
  'ai-queue',
  async (job) => {
    console.log(`⚡ Processing AI job ${job.id}:`, job.data);

    const { conversationId, message, userId } = job.data;

    try {
      const aiResponse = await aiService.generateResponse(conversationId, message, userId);

      console.log(`✅ AI response generated for job ${job.id}`);
      return {
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error processing AI job ${job.id}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 18908,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD
    },
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 15000
    },
    removeOnComplete: 10,
    removeOnFail: 5,
    drainDelay: 5
  }
);

// Worker events
aiWorker.on('completed', (job) => {
  console.log(`🎯 AI job ${job.id} completed successfully with result:`, job.returnvalue);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ AI job ${job.id} failed:`, err);
});

aiWorker.on('error', (err) => {
  console.error('❌ AI worker error:', err);
});

console.log('🚀 AI Worker initialized and ready to process jobs');
