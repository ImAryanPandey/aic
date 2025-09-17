import React from 'react';

export default function Message({ message }) {
  const mine = message.messageType === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} message-enter`}>
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm
        ${mine ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 rounded-bl-none'}`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className={`text-[10px] mt-1 ${mine ? 'text-indigo-100' : 'text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}