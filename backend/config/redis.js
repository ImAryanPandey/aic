import { createClient } from 'redis';

// Create Redis client using environment variables
const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
  }
});

// Handle connection errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Handle successful connection
redisClient.on('connect', () => {
  console.log('Connected to Redis Cloud');
});

// Connect to Redis
redisClient.connect().catch(console.error);

export default redisClient;