import http from 'http';
import app from './app.js';
import { initializeSocket } from './socket/index.js';
import connectDB from '../config/db.js';
import redisClient from '../config/redis.js';

// Set port
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Connect to MongoDB
connectDB();

redisClient.on('connect', () => {
  console.log('Redis connection established');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});