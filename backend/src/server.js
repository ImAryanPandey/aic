import http from 'http';
import app from './app.js';
import { initializeSocket } from './socket/index.js';
import connectDB from '../config/db.js';
import { Worker } from 'bullmq';
import { config } from 'dotenv';
import * as path from 'path';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { redisConnection } from '../config/redis.js';

const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Connect MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
});

// Worker for AI events → sends messages to clients
const aiEventsWorker = new Worker(
  'ai-events',
  async (job) => {
    try {
      const data = job.data;
      io.to(data.conversationId).emit('messageReceived', { ...data });
      io.to(data.conversationId).emit('aiProcessing', { jobId: job.id, status: 'completed' });

      return { ok: true };
    } catch (err) {
      console.error('❌ Error emitting ai-event job:', err);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

aiEventsWorker.on('completed', (job) => console.log(`✅ ai-events job ${job.id} completed`));
aiEventsWorker.on('failed', (job, err) => console.error(`❌ ai-events job ${job?.id} failed:`, err.message));

server.on('error', (error) => console.error('❌ Server error:', error));
