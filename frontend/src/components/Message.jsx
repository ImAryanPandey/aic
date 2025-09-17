import React from 'react';

const Message = ({ message }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex ${
        message.messageType === 'user' ? 'justify-end' : 'justify-start'
      } animate-fade-in`}
    >
      <div
        className={`message-bubble ${
          message.messageType === 'user' 
            ? 'user-message' 
            : 'ai-message'
        }`}
      >
        <div className="font-medium mb-1">
          {message.messageType === 'user' ? 'You' : 'AI Assistant'}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-1 ${
          message.messageType === 'user' 
            ? 'text-primary-100' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Message);