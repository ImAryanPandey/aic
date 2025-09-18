// src/services/queueService.js
import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT) || 18908,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD
};

// Main AI job queue
const aiQueue = new Queue('ai-queue', { connection });

// Event queue for AI responses (worker → server → clients)
const aiEventsQueue = new Queue('ai-events', { connection });

export const addAIJob = async ({ conversationId, message, userId }) => {
  const job = await aiQueue.add('process-message', {
    conversationId,
    message,
    userId
  });
  console.log(`📥 Queued AI job ${job.id} for conversation ${conversationId}`);
  return job.id;
};

export const emitAIEvent = async (eventName, payload) => {
  await aiEventsQueue.add(eventName, payload);
  console.log(`📤 Event queued: ${eventName} → conv ${payload.conversationId}`);
};

export default { addAIJob, emitAIEvent };
