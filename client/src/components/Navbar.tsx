import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bot, Terminal, Layout, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    // Clear the JWT token cookie
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Redirect to Auth page
    navigate('/auth');
  };

  return (
    <nav className="flex items-center justify-between w-full h-16 px-4 md:px-8 bg-white border-b border-slate-200 dark:bg-black dark:border-red-900/50 z-50 transition-colors duration-300 flex-shrink-0">
      
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-600 dark:bg-red-600 rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-red-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-slate-900 dark:text-white hidden sm:block">Neuro-Path</span>
      </div>
      
      {/* Navigation Links */}
      <div className="flex items-center space-x-1 md:space-x-4">
        <NavLink 
          to="/dashboard"
          className={({ isActive }) => `p-2 md:px-4 md:py-2 rounded-xl flex items-center space-x-2 transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-red-500/10 dark:text-red-500 font-medium' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-zinc-800'}`}
          title="Dashboard"
        >
          <Layout className="w-5 h-5" />
          <span className="hidden md:block">Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/chat"
          className={({ isActive }) => `p-2 md:px-4 md:py-2 rounded-xl flex items-center space-x-2 transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-red-500/10 dark:text-red-500 font-medium' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-zinc-800'}`}
          title="Agent Console"
        >
          <Terminal className="w-5 h-5" />
          <span className="hidden md:block">Agent</span>
        </NavLink>

        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1 md:mx-2"></div>

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
