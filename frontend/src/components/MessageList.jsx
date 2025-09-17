import React, { useEffect, useRef } from 'react';
import Message from './Message';

export default function MessageList({ messages }) {
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="px-4 py-6 space-y-3">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-400 mt-12">
          <div className="p-4 bg-white rounded-full shadow mb-4">
            <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-lg font-medium">Start a conversation</div>
          <div className="text-sm mt-1">Ask anything — this assistant is powered by an LLM.</div>
        </div>
      ) : (
        messages.map((m, i) => <Message key={`${m.timestamp}-${i}`} message={m} />)
      )}
      <div ref={endRef} />
    </div>
  );
}
