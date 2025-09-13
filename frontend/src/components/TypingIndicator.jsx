import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 animate-slide-up">
      <div className="flex space-x-1">
        <div className="typing-dot" style={{ animationDelay: '0ms' }}></div>
        <div className="typing-dot" style={{ animationDelay: '150ms' }}></div>
        <div className="typing-dot" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm">AI is thinking...</span>
    </div>
  );
};

export default TypingIndicator;