import React, { useState, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { socketService } from '../services/socket';
import Sidebar from '../components/Sidebar';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('agent_status', (data) => {
      setStatus(data.status);
      setLogs((prev) => [...prev, `[${data.status}] ${data.message}`]);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    
    setLogs((prev) => [...prev, `> Task: ${message}`]);
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('start_task', { task: message });
    }
    setMessage('');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-black overflow-hidden transition-colors duration-300">
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col w-full h-[calc(100vh-4rem)] md:h-screen">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 dark:bg-black dark:border-red-900/50 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Autonomous Agent Beta</h2>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              status === 'running' ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
              status === 'error' ? 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
              'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
            }`}>
              {status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 dark:from-red-600 dark:to-orange-500 flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        {/* Console / Logs */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 font-mono text-sm custom-scrollbar bg-slate-50 dark:bg-black transition-colors duration-300">
          {logs.map((log, i) => (
            <div key={i} className={`p-3 rounded-lg border ${
              log.startsWith('>') 
                ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-transparent dark:border-red-900/50 dark:text-red-400' 
                : 'bg-white border-slate-200 text-slate-600 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-400'
            }`}>
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-zinc-600 space-y-4">
              <Bot className="w-12 h-12 opacity-50 dark:opacity-20" />
              <p className="text-lg font-medium opacity-80 dark:opacity-50 text-center px-4">Enter a task to begin autonomous execution</p>
            </div>
          )}
        </main>

        {/* Input Area */}
        <footer className="p-4 md:p-6 bg-white border-t border-slate-200 dark:bg-black dark:border-red-900/50 transition-colors duration-300 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto flex space-x-4">
            <div className="flex-grow relative">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="e.g. 'Search for the latest AI news and summarize'"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 shadow-sm dark:bg-zinc-900 dark:border-red-900/50 dark:text-white dark:placeholder:text-zinc-500 dark:focus:ring-red-500 transition-all"
              />
              <button 
                onClick={handleSend}
                className="absolute right-3 top-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
                disabled={status === 'running'}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;
