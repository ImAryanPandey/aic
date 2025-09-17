import { Server } from 'socket.io';
import { addAIJob } from '../services/queueService.js';

const initializeSocket = (server) => {
  console.log('🔌 Initializing socket server...');
  
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    // Create conversation
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

    // Join conversation
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`📥 User ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle messages
    socket.on('newMessage', async (data) => {
      try {
        console.log('💬 New message:', data);
        
        // Broadcast user message
        io.to(data.conversationId).emit('messageReceived', {
          ...data,
          timestamp: new Date().toISOString()
        });
        
        // Add AI job to queue
        const jobId = await addAIJob({
          conversationId: data.conversationId,
          message: data.content,
          userId: data.sender
        });
        
        // Notify AI processing
        io.to(data.conversationId).emit('aiProcessing', {
          jobId,
          status: 'processing'
        });
        
        // Clear processing status after timeout
        setTimeout(() => {
          io.to(data.conversationId).emit('aiProcessing', {
            jobId,
            status: 'completed'
          });
        }, 15000);
      } catch (error) {
        console.error('❌ Error processing message:', error);
        socket.emit('errorMessage', { message: 'Failed to process message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);
    });
  });

  return io;
};

export { initializeSocket };