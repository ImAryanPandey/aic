import { Queue } from 'bullmq';

// Create a new queue for processing AI requests
const aiQueue = new Queue('ai-queue', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD
  }
});

// Add a job to the queue
async function addAIJob(jobData) {
  try {
    const job = await aiQueue.add('process-ai-request', jobData, {
      attempts: 3, // Retry 3 times if failed
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 seconds delay
      },
      removeOnComplete: 10, // Keep last 10 completed jobs
      removeOnFail: 5 // Keep last 5 failed jobs
    });
    
    console.log(`AI job added with ID: ${job.id}`);
    return job.id;
  } catch (error) {
    console.error('Error adding AI job:', error);
    throw error;
  }
}

// Get job status
async function getJobStatus(jobId) {
  try {
    const job = await aiQueue.getJob(jobId);
    if (!job) return null;
    
    const state = await job.getState();
    return {
      id: job.id,
      state,
      progress: job.progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
}

export { addAIJob, getJobStatus };