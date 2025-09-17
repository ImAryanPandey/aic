import { Worker } from 'bullmq';
import aiService from '../services/aiService.js';
import { createClient } from 'redis';

console.log('Initializing AI Worker...');

// Create Redis client for BullMQ with latest options
const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 30000),
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000
  }
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  console.error('Worker Redis client error:', err);
});

// Connect to Redis
redisClient.connect().catch(err => {
  console.error('Worker failed to connect to Redis:', err);
});

// Create a worker with the latest BullMQ v5 options
const aiWorker = new Worker(
  'ai-queue',
  async (job) => {
    console.log(`Processing AI job ${job.id}:`, job.data);
    
    const { conversationId, message, userId } = job.data;
    
    try {
      // Process the AI request
      const aiResponse = await aiService.generateResponse(
        conversationId, 
        message, 
        userId
      );
      
      console.log(`AI response generated for job ${job.id}:`, aiResponse);
      
      // Return the result
      return {
        success: true,
        response: aiResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error processing AI job ${job.id}:`, error);
      
      // Return error information
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
    // Use the latest BullMQ v5 options
    removeOnComplete: 10,
    removeOnFail: 5,
    drainDelay: 5
  }
);

// Listen for completed jobs
aiWorker.on('completed', (job) => {
  console.log(`AI job ${job.id} completed successfully with result:`, job.returnvalue);
});

// Listen for failed jobs
aiWorker.on('failed', (job, err) => {
  console.error(`AI job ${job.id} failed:`, err);
});

// Handle worker errors
aiWorker.on('error', (err) => {
  console.error('AI worker error:', err);
});

console.log('AI Worker initialized and ready to process jobs');

export default aiWorker;