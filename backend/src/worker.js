// src/worker.js
import { Worker } from 'bullmq';
import aiService from './services/aiService.js';
import connectDB from '../config/db.js';
import { config } from 'dotenv';
import * as path from 'path';

// Load .env manually (ensures it works no matter where you run worker)
const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

console.log('🏭 Initializing AI Worker...');

// Connect to MongoDB
await connectDB();
console.log('✅ MongoDB connection ready for Worker');

// Create worker
const aiWorker = new Worker(
  'ai-queue',
  async (job) => {
    console.log(`🔄 Processing AI job ${job.id}:`, job.data);

    const { conversationId, message, userId } = job.data;

    try {
      const aiResponse = await aiService.generateResponse(conversationId, message, userId);

      console.log(`✅ AI response generated for job ${job.id}`);

      return {
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error processing AI job ${job.id}:`, error);

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
  }
);

// Worker events
aiWorker.on('completed', (job) => {
  console.log(`✅ AI job ${job.id} completed`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ AI job ${job.id} failed:`, err.message);
});

aiWorker.on('error', (err) => {
  console.error('❌ Worker error:', err.message);
});

console.log('✅ AI Worker ready');
