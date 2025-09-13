import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import DarkModeToggle from './DarkModeToggle';

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [userId] = useState(`user-${Math.floor(Math.random() * 1000000)}`);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    // Connect to the backend server
    socketRef.current = io('http://localhost:5000');
    
    // Handle connection
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
      
      // Create a new conversation
      socketRef.current.emit('createConversation', {
        participants: [userId],
        title: 'New Chat'
      });
    });

    // Handle disconnection
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    // Handle conversation created
    socketRef.current.on('conversationCreated', (data) => {
      console.log('Conversation created:', data);
      setConversationId(data.conversationId);
      socketRef.current.emit('joinConversation', data.conversationId);
    });

    // Handle received messages
    socketRef.current.on('messageReceived', (message) => {
      console.log('Message received:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    // Handle AI processing status
    socketRef.current.on('aiProcessing', (data) => {
      console.log('AI processing:', data);
      setIsTyping(data.status === 'processing');
    });

    // Handle errors
    socketRef.current.on('errorMessage', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content) => {
    if (!content.trim() || !conversationId) return;
    
    const message = {
      conversationId,
      sender: userId,
      content,
      messageType: 'user',
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending message:', message);
    
    // Add message to local state
    setMessages(prevMessages => [...prevMessages, message]);
    
    // Send message to server
    socketRef.current.emit('newMessage', message);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary-600 dark:bg-primary-800 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Assistant</h1>
            <div className="flex items-center">
              <span className="text-xs text-primary-100 mr-2">
                {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
              </span>
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            </div>
          </div>
        </div>
        <DarkModeToggle />
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
        <MessageList messages={messages} />
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <MessageInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default ChatContainer;