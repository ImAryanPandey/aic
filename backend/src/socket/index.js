import { Server } from 'socket.io';
import { addAIJob } from '../services/queueService.js';

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room (for conversation-specific messaging)
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle new messages
    socket.on('newMessage', async (data) => {
      try {
        // Broadcast user message to all users in the conversation
        io.to(data.conversationId).emit('messageReceived', {
          ...data,
          timestamp: new Date().toISOString()
        });
        
        // Add AI processing job to queue
        const jobId = await addAIJob({
          conversationId: data.conversationId,
          message: data.content,
          userId: data.sender
        });
        
        // Notify that AI is processing
        io.to(data.conversationId).emit('aiProcessing', {
          jobId,
          status: 'processing'
        });
      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('errorMessage', {
          message: 'Failed to process message'
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export { initializeSocket };