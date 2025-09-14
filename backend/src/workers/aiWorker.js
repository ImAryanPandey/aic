import { Worker } from 'bullmq';
import aiService from '../services/aiService.js';

console.log('Initializing AI Worker...');

// Create a worker to process AI requests
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
      port: parseInt(process.env.REDIS_PORT) || 18908, // Fallback port
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD
    },
    concurrency: 5, // Process 5 jobs simultaneously
    limiter: {
      max: 10, // Max 10 jobs per 15 seconds
      duration: 15000
    }
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