import React from 'react';

export default function Message({ message }) {
  const mine = message.messageType === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} px-4`}>
      <div
        className={`max-w-[72%] px-4 py-3 rounded-2xl shadow-sm message-enter
          ${mine
            ? 'bg-indigo-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'}
        `}
        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
      >
        <div className={`${mine ? '' : 'text-sm text-gray-500 dark:text-gray-400 mb-1'}`}>
          {!mine && 'AI Assistant'}
        </div>
        <div className="text-base leading-relaxed">
          <span className={`${mine ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
            {message.content}
          </span>
        </div>
        <div className={`text-[10px] mt-2 ${mine ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
