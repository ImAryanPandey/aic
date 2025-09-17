import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Loader2 } from "lucide-react";

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [userId] = useState(`user-${Math.floor(Math.random() * 1000000)}`);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("createConversation", {
        participants: [userId],
        title: "New Chat",
      });
    });

    socketRef.current.on("conversationCreated", (data) => {
      setConversationId(data.conversationId);
      socketRef.current.emit("joinConversation", data.conversationId);
    });

    socketRef.current.on("messageReceived", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on("aiProcessing", (data) => {
      setIsTyping(data.status === "processing");
    });

    return () => socketRef.current.disconnect();
  }, [userId]);

  const handleSendMessage = (content) => {
    if (!content.trim() || !conversationId) return;

    const msg = {
      conversationId,
      sender: userId,
      content,
      messageType: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, msg]);
    socketRef.current.emit("newMessage", msg);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="p-4 bg-indigo-600 text-white shadow-md flex items-center justify-between">
        <h1 className="text-lg font-semibold">🤖 AI Assistant</h1>
        <span className="text-xs text-indigo-200">online</span>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        {isTyping && (
          <div className="flex items-center text-gray-500 text-sm mt-2">
            <Loader2 className="animate-spin mr-2" size={16} /> AI is typing...
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="p-4 border-t bg-white dark:bg-gray-800">
        <MessageInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </footer>
    </div>
  );
};

export default ChatContainer;
