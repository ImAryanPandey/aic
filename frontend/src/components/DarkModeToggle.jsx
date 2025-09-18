import React, { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const enabled = saved ? saved === 'true' : prefers;
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);
  }, []);

  const toggle = () => {
    const n = !dark;
    setDark(n);
    document.documentElement.classList.toggle('dark', n);
    localStorage.setItem('darkMode', n.toString());
  };

  return (
    <button onClick={toggle} aria-label="Toggle dark mode" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
      {dark ? (
        <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.47 4.54l1.79 1.8 1.5-1.5zm10.48 0l1.79-1.79 1.5 1.5-1.79 1.79-1.5-1.5zM12 4V1h0v3zM4 12H1v0h3zm19 0h-3v0h3zM6.76 19.16l-1.79 1.79 1.5 1.5 1.79-1.79-1.5-1.5zM19.24 19.16l1.5 1.5 1.79-1.79-1.5-1.5-1.79 1.79zM12 20v3h0v-3zM16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ) : (
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a9.93 9.93 0 00-7.07 2.93A10 10 0 1012 2z" /></svg>
      )}
    </button>
  );
}
