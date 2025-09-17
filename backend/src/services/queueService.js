import { Queue } from 'bullmq';

const aiQueue = new Queue('ai-queue', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 18908,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

export const addAIJob = async (jobData) => {
  try {
    const job = await aiQueue.add('process-ai-request', jobData);
    console.log(`📝 AI job added with ID: ${job.id}`);
    return job.id;
  } catch (error) {
    console.error('❌ Error adding AI job:', error);
    throw error;
  }
};