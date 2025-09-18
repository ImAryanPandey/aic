// src/socket/index.js
import { Server } from 'socket.io';
import { addAIJob } from '../services/queueService.js';

let io; // shared instance

const initializeSocket = (server) => {
  console.log('🔌 Initializing socket server...');

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    socket.on('createConversation', async (data) => {
      console.log('📝 Creating conversation:', data);
      try {
        const chatService = await import('../services/chatService.js');
        const conversation = await chatService.default.createConversation(
          data.participants,
          data.title
        );

        socket.emit('conversationCreated', {
          conversationId: conversation.conversationId
        });

        console.log('✅ Conversation created:', conversation.conversationId);
      } catch (error) {
        console.error('❌ Error creating conversation:', error);
        socket.emit('errorMessage', { message: 'Failed to create conversation' });
      }
    });

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`📥 User ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('newMessage', async (data) => {
      try {
        console.log('💬 New message:', data);

        // Broadcast user's message immediately
        io.to(data.conversationId).emit('messageReceived', {
          ...data,
          timestamp: new Date().toISOString()
        });

        // Add job for AI processing
        const jobId = await addAIJob({
          conversationId: data.conversationId,
          message: data.content,
          userId: data.sender
        });

        // Notify clients that AI processing started
        io.to(data.conversationId).emit('aiProcessing', {
          jobId,
          status: 'processing'
        });
      } catch (error) {
        console.error('❌ Error processing message:', error);
        socket.emit('errorMessage', { message: 'Failed to process message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized yet!');
  return io;
};

export { initializeSocket, getIO };
