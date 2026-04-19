import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bot, Terminal, Layout, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    // Clear the JWT token cookie
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Redirect to Auth page
    navigate('/auth');
  };

  return (
    <div className="md:w-16 md:flex-shrink-0 md:h-screen w-full h-16 fixed md:relative bottom-0 left-0 bg-white border-t md:border-t-0 md:border-r border-slate-200 dark:bg-black dark:border-red-900/50 flex md:flex-col items-center justify-around md:justify-start md:py-6 space-y-0 md:space-y-4 px-4 md:px-0 z-50 transition-colors duration-300">
      
      {/* Brand Icon (Hidden on mobile) */}
      <div className="hidden md:flex p-2 bg-blue-600 dark:bg-red-600 rounded-xl mb-4 shadow-lg shadow-blue-500/20 dark:shadow-red-500/20">
        <Bot className="w-6 h-6 text-white" />
      </div>
      
      <NavLink 
        to="/dashboard"
        className={({ isActive }) => `p-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-red-500/10 dark:text-red-500' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-zinc-800'}`}
        title="Dashboard"
      >
        <Layout className="w-6 h-6" />
      </NavLink>
      
      <NavLink 
        to="/chat"
        className={({ isActive }) => `p-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-red-500/10 dark:text-red-500' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-zinc-800'}`}
        title="Agent Console"
      >
        <Terminal className="w-6 h-6" />
      </NavLink>

      <button
        onClick={toggleTheme}
        className="p-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 md:mt-auto md:mb-2"
        title="Toggle Theme"
      >
        {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
      </button>
      
      <div className="md:!mb-4">
        <button 
          onClick={handleLogout}
          className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200"
          title="Log Out"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
