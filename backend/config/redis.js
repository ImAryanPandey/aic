import { createClient } from 'redis';

// ✅ Validate env vars
['REDIS_HOST', 'REDIS_PORT', 'REDIS_USERNAME', 'REDIS_PASSWORD'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing Redis environment variable: ${key}`);
    process.exit(1);
  }
});

// ⚡ General Redis client (for caching, redisService etc.)
const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  pingInterval: 10000,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 30000),
    connectTimeout: 10000,
    commandTimeout: 5000,
  },
});

redisClient.on('error', (err) => console.error('❌ Redis Error:', err.message));
redisClient.on('connect', () => console.log('✅ Connected to Redis Cloud'));
redisClient.on('reconnecting', () => console.log('🔄 Reconnecting to Redis...'));

await redisClient.connect().catch((err) => {
  console.error('❌ Redis connection failed:', err.message);
  process.exit(1);
});

// ⚡ BullMQ-compatible connection config
const redisConnection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};

export { redisClient, redisConnection };
