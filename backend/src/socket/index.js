import { Server } from 'socket.io';
import { addAIJob } from '../services/queueService.js';

const initializeSocket = (server) => {
  console.log('Initializing socket server...');
  
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
    console.log('User connected:', socket.id);
    console.log('Transport:', socket.conn.transport.name);

    // Handle transport changes
    socket.conn.on('upgrade', (transport) => {
      console.log('Transport upgraded to:', transport.name);
    });

    // Handle creating a new conversation
    socket.on('createConversation', async (data) => {
      console.log('Creating conversation:', data);
      try {
        // Create a simple conversation object (avoid circular dependency)
        const conversation = {
          _id: `conv-${Date.now()}`,
          participants: data.participants,
          title: data.title || 'New Chat',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Send conversation created event back to client
        socket.emit('conversationCreated', {
          conversationId: conversation._id
        });
        
        console.log('Conversation created:', conversation._id);
      } catch (error) {
        console.error('Error creating conversation:', error);
        socket.emit('errorMessage', { message: 'Failed to create conversation' });
      }
    });

    // Join a room (for conversation-specific messaging)
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle new messages
    socket.on('newMessage', async (data) => {
      try {
        console.log('New message received:', data);
        
        // Broadcast user message to all users in the conversation
        io.to(data.conversationId).emit('messageReceived', {
          ...data,
          timestamp: new Date().toISOString()
        });
        
        // Add AI processing job to queue
        try {
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
        } catch (queueError) {
          console.error('Queue error:', queueError);
          // Fallback: send a simple response
          setTimeout(() => {
            io.to(data.conversationId).emit('messageReceived', {
              conversationId: data.conversationId,
              sender: 'AI',
              content: 'I received your message: ' + data.content,
              messageType: 'ai',
              timestamp: new Date().toISOString()
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('errorMessage', {
          message: 'Failed to process message'
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('User disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  });

  return io;
};

export { initializeSocket };