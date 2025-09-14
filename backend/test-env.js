import dotenv from 'dotenv';
dotenv.config();

console.log('Environment Variables Test:');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✓ Present' : '✗ Missing');
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
console.log('REDIS_USERNAME:', process.env.REDIS_USERNAME);
console.log('MONGO_URI:', process.env.MONGO_URI ? '✓ Present' : '✗ Missing');