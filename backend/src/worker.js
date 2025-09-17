import { Worker } from 'bullmq';
import aiService from './services/aiService.js';
import { createClient } from 'redis';
import path from 'path';
import { config } from 'dotenv';
import connectDB from '../config/db.js';

const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

console.log('🏭 Initializing Worker...');

// Debug env variables
console.log('🔍 Environment Variables Check:', {
  REDIS_HOST: process.env.REDIS_HOST ? '✅' : '❌',
  REDIS_PORT: process.env.REDIS_PORT ? '✅' : '❌',
  REDIS_USERNAME: process.env.REDIS_USERNAME ? '✅' : '❌',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '✅' : '❌',
  MONGO_URI: process.env.MONGO_URI ? '✅' : '❌'
});

// Exit if Redis vars are missing
if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_USERNAME || !process.env.REDIS_PASSWORD) {
  console.error('❌ Missing Redis environment variables!');
  process.exit(1);
}

// Connect MongoDB before starting worker
await connectDB();
console.log('✅ MongoDB connection ready for Worker');

// Redis client (optional — not strictly needed because Worker takes connection config)
const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 30000),
    connectTimeout: 10000,
    commandTimeout: 5000
  }
});

redisClient.on('error', (err) => {
  console.error('❌ Worker Redis error:', err.message);
});

await redisClient.connect().then(() => {
  console.log('✅ Worker Redis connected');
}).catch(err => {
  console.error('❌ Worker Redis connection failed:', err.message);
});

// BullMQ Worker
const worker = new Worker(
  'ai-queue',
  async (job) => {
    console.log(`🔄 Processing job ${job.id}:`, job.data);

    const { conversationId, message, userId } = job.data;

    try {
      const aiResponse = await aiService.generateResponse(conversationId, message, userId);
      console.log(`✅ Job ${job.id} response generated`);
      return {
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
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
    limiter: { max: 10, duration: 15000 }
  }
);

// Worker events
worker.on('completed', (job) => {
  console.log(`🎯 Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log('🚀 Worker initialized and ready to process jobs');
