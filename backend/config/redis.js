import { createClient } from 'redis';

// Check if all required environment variables are present
if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_USERNAME || !process.env.REDIS_PASSWORD) {
  console.error('❌ Redis environment variables are missing!');
  console.error('Required: REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD');
  process.exit(1);
}

const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  pingInterval: 10000,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 30000),
    connectTimeout: 10000,
    commandTimeout: 5000,
  }
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis Cloud');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Reconnecting to Redis...');
});

// Connect to Redis
redisClient.connect().catch(err => {
  console.error('❌ Failed to connect to Redis:', err.message);
});

export default redisClient;