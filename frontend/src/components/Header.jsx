import React from 'react';
import DarkModeToggle from './DarkModeToggle';

export default function Header({ connectionStatus }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow">
      {/* Left: Logo + Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 8v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="font-semibold">AI Assistant</div>
          <div className="text-xs opacity-90">
            {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>

      {/* Right: Status + Dark Mode Toggle */}
      <div className="flex items-center gap-3">
        <div className="text-xs bg-white/20 px-3 py-1 rounded-full">{connectionStatus}</div>
        <DarkModeToggle />
      </div>
    </header>
  );
}
