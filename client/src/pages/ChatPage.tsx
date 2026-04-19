import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Plus, MessageSquare, Menu, X } from 'lucide-react';
import { socketService } from '../services/socket';
import Navbar from '../components/Navbar';
import axios from 'axios';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('idle');
  const [sessions, setSessions] = useState<{_id: string, title: string}[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [checkpoints, setCheckpoints] = useState<{type: string, image: string}[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = getCookie('token');
        const res = await axios.get('http://localhost:5000/api/chats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSessions(res.data);
      } catch (err) {
        console.error('Failed to fetch sessions', err);
      }
    };
    fetchSessions();
    const socket = socketService.connect();

    socket.on('agent_status', (data) => {
      setStatus(data.status);
      setLogs((prev) => [...prev, `[${data.status.toUpperCase()}] ${data.message}`]);
    });

    socket.on('agent_complete', (data) => {
      setStatus('idle');
      setLogs((prev) => [...prev, `> [AGENT] ✨ ${data.data}`]);
    });

    socket.on('agent_plan', (data) => {
      setActivePlan(data);
      setLogs((prev) => [...prev, `[PLANNER] Intent Identified: ${data.intent}`]);
    });

    socket.on('agent_checkpoint', (data) => {
      setCheckpoints((prev) => [...prev, data]);
      setLogs((prev) => [...prev, `📸 Checkpoint captured: ${data.type}`]);
    });

    socket.on('agent_error', (data) => {
      setStatus('error');
      setLogs((prev) => [...prev, `[ERROR] ❌ Failed: ${data.error}`]);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setLogs([]);
    setStatus('idle');
    setActivePlan(null);
    setCheckpoints([]);
  };

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setLogs([]);
    setActivePlan(null);
    setCheckpoints([]);
    try {
      const token = getCookie('token');
      const res = await axios.get(`http://localhost:5000/api/chats/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const formattedLogs = res.data.map((m: any) => 
        m.sender === 'user' ? `> [USER] ${m.text}` : `> [AGENT] ✨ ${m.text}`
      );
      setLogs(formattedLogs);
      
      // Restore the latest plan if it exists
      const lastAgentMessage = [...res.data].reverse().find((m: any) => m.sender === 'agent' && m.metadata);
      if (lastAgentMessage) {
        setActivePlan(lastAgentMessage.metadata);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    let currentSessionId = activeSessionId;
    const token = getCookie('token');
    
    if (!currentSessionId) {
      try {
        // Only grab the first chunk for the title
        const titleText = message.length > 30 ? message.substring(0, 30) + '...' : message;
        const res = await axios.post('http://localhost:5000/api/chats', { title: titleText }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        currentSessionId = res.data._id;
        setActiveSessionId(currentSessionId);
        setSessions(prev => [res.data, ...prev]);
      } catch (err) {
        console.error('Failed to create session', err);
      }
    }

    setLogs((prev) => [...prev, `> Planner Init: analyzing "${message}"`]);
    setActivePlan(null);
    setCheckpoints([]);
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('start_agent_task', { prompt: message, sessionId: currentSessionId });
    }
    setMessage('');
  };

  const renderLogText = (log: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = log.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
         return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 hover:text-blue-800 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-1">{part}</a>
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-black overflow-hidden transition-colors duration-300">
      <Navbar />

      <div className="relative flex flex-grow h-[calc(100vh-4rem)]">
        {/* Mobile History Overlay Background */}
        {showHistory && (
          <div 
            className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 z-30 lg:hidden transition-opacity"
            onClick={() => setShowHistory(false)}
          />
        )}

        {/* History Sidebar */}
        <div className={`absolute lg:static z-40 h-full w-64 bg-white border-r border-slate-200 dark:bg-zinc-950 dark:border-red-900/50 transition-transform duration-300 flex flex-col ${showHistory ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 flex items-center justify-between">
            <button 
              onClick={() => {
                handleNewChat();
                setShowHistory(false);
              }}
              className="flex-grow flex items-center justify-center space-x-2 p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>New Task</span>
            </button>
            <button 
              className="lg:hidden ml-2 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              onClick={() => setShowHistory(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50 dark:bg-black">
          {sessions.map((session) => (
            <button
              key={session._id}
              onClick={() => {
                loadSession(session._id);
                setShowHistory(false);
              }}
              className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                activeSessionId === session._id 
                  ? 'bg-slate-200 text-slate-900 dark:bg-zinc-900 dark:text-white' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-sm font-medium">{session.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col w-full h-full min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 dark:bg-black dark:border-red-900/50 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowHistory(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 truncate">Autonomous Agent Beta</h2>
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

        {/* Intent Tracker Card */}
        {activePlan && (
          <div className="bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-red-900/50 p-4 shrink-0 transition-colors shadow-sm z-10">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center">
              <Bot className="w-4 h-4 mr-2 text-blue-500 dark:text-red-500" />
              Dynamic Execution Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-zinc-500">Detected Intent:</p>
                <p className="text-blue-600 dark:text-red-400 font-medium">{activePlan.intent}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-zinc-500">Discovery Goal:</p>
                <p className="text-slate-800 dark:text-slate-300 truncate" title={activePlan.goal}>{activePlan.goal}</p>
              </div>
            </div>
            <div className="mt-4">
               <p className="text-slate-500 dark:text-zinc-500 text-[10px] uppercase mb-2 font-bold tracking-wider">Generated Discovery Queries:</p>
               <div className="flex flex-wrap gap-2">
                 {activePlan.searchQueries?.map((q: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-900 rounded-lg text-slate-700 dark:text-zinc-300 text-xs border border-slate-200 dark:border-zinc-800">{q}</span>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* Live Observation Strip */}
        {checkpoints.length > 0 && (
          <div className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 p-3 h-32 flex-shrink-0 z-10">
             <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold dark:text-zinc-400 uppercase tracking-widest">Live Agent Observation</span>
             </div>
             <div className="flex space-x-3 overflow-x-auto custom-scrollbar pb-2 h-full">
                {checkpoints.map((cp, idx) => (
                   <div key={idx} className="relative group flex-shrink-0 h-20 w-32 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 bg-black shadow-sm">
                      <img src={`data:image/jpeg;base64,${cp.image}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={cp.type} />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                         <p className="text-[8px] text-white truncate text-center uppercase tracking-tighter">{cp.type.replace(/_/g, ' ')}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Console / Logs */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 font-mono text-sm custom-scrollbar bg-slate-50 dark:bg-black transition-colors duration-300">
          {logs.map((log, i) => (
            <div key={i} className={`p-3 rounded-lg border whitespace-pre-wrap leading-relaxed ${
              log.startsWith('>') 
                ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-zinc-900/40 dark:border-red-900/30 dark:text-slate-200' 
                : 'bg-white border-slate-200 text-slate-600 dark:bg-[#0f0f0f] dark:border-zinc-800 dark:text-zinc-400'
            }`}>
              {renderLogText(log)}
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
    </div>
  );
};

export default ChatPage;
