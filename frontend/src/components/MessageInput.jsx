import React, { useState } from "react";

const MessageInput = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
      />
      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput;
