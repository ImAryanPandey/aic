import React, { useState, useRef, useEffect } from 'react';

export default function MessageInput({ onSendMessage, disabled }) {
  const [value, setValue] = useState('');
  const ref = useRef();

  useEffect(() => ref.current?.focus(), []);

  const submit = (e) => {
    e?.preventDefault();
    if (!value.trim() || disabled) return;
    onSendMessage(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={submit} className="flex gap-3 items-center px-4 py-3 bg-white shadow-inner">
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={disabled}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
      />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
