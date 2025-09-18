// src/worker.js
import { Worker, Queue } from 'bullmq';
import aiService from './services/aiService.js';
import connectDB from '../config/db.js';
import { config } from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

console.log('🏭 Initializing AI Worker...');

// Connect to MongoDB
await connectDB();
console.log('✅ MongoDB connection ready for Worker');

// Queue used to send events back to server
const aiEventsQueue = new Queue('ai-events', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 18908,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD
  }
});

const aiWorker = new Worker(
  'ai-queue',
  async (job) => {
    console.log(`🔄 Processing AI job ${job.id}:`, job.data);

    const { conversationId, message, userId } = job.data;

    try {
      const aiResponse = await aiService.generateResponse(conversationId, message, userId);

      console.log(`✅ AI response generated for job ${job.id}`);

      // Persisted message is already saved by aiService; now send an event for server to emit to clients
      await aiEventsQueue.add('ai-response', {
        conversationId,
        sender: 'ai',
        content: aiResponse,
        messageType: 'ai',
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        response: aiResponse
      };
    } catch (error) {
      console.error(`❌ Error processing AI job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 18908,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD
    },
    concurrency: 5
  }
);

aiWorker.on('completed', (job) => {
  console.log(`✅ AI job ${job.id} completed`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ AI job ${job.id} failed:`, err.message);
});

console.log('✅ AI Worker ready');
