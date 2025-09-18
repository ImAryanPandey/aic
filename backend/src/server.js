// src/server.js
import http from 'http';
import app from './app.js';
import { initializeSocket } from './socket/index.js';
import connectDB from '../config/db.js';
import { Worker } from 'bullmq';
import * as path from 'path';
import { config } from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Connect to MongoDB
connectDB();

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/test`);
});

// Start a small consumer (in server process) for ai-events queue
// Server will process ai-events jobs and emit via Socket.IO
const aiEventsWorker = new Worker(
  'ai-events',
  async (job) => {
    try {
      const data = job.data;
      console.log('📤 Server emitting AI event to room:', data.conversationId);
      io.to(data.conversationId).emit('messageReceived', {
        ...data
      });

      // Also emit completion of aiProcessing if you want
      io.to(data.conversationId).emit('aiProcessing', {
        jobId: job.id,
        status: 'completed'
      });

      return { ok: true };
    } catch (err) {
      console.error('❌ Error emitting ai-event job:', err);
      throw err;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 18908,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD
    },
    concurrency: 2
  }
);

aiEventsWorker.on('completed', (job) => {
  console.log(`✅ ai-events job ${job.id} completed`);
});

aiEventsWorker.on('failed', (job, err) => {
  console.error(`❌ ai-events job ${job.id} failed:`, err.message);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});
