import React from 'react';
import { Activity, Globe, Cpu, Zap, RotateCcw, Play, Pause } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const DashboardPage = () => {
  const stats = [
    { label: 'Active Sessions', value: '4', icon: Activity, color: 'text-blue-400' },
    { label: 'Pages Crawled', value: '1,284', icon: Globe, color: 'text-emerald-400' },
    { label: 'Inference Time', value: '1.2s', icon: Cpu, color: 'text-purple-400' },
    { label: 'Success Rate', value: '98.2%', icon: Zap, color: 'text-amber-400' },
  ];

  const recentActions = [
    { id: 1, action: 'Travel Research', status: 'Completed', time: '2 mins ago' },
    { id: 2, action: 'Product Comparison', status: 'Running', time: 'Active' },
    { id: 3, action: 'News Summarization', status: 'Completed', time: '1 hour ago' },
    { id: 4, action: 'Job Search Automation', status: 'Failed', time: '3 hours ago' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-black overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-grow overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Agent Dashboard</h1>
          <p className="text-slate-500 dark:text-zinc-400">Monitor your autonomous agent fleet across the web.</p>
        </div>
        <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm dark:bg-zinc-900 dark:border-red-900/50 dark:text-slate-300 dark:hover:bg-zinc-800 transition-colors duration-300">
          <RotateCcw className="w-4 h-4" />
          <span>Refresh Metrics</span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm dark:bg-zinc-900/50 dark:border-red-900/50 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-6 h-6 ${stat.color} dark:text-red-500`} />
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">REAL-TIME</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Executions */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm dark:bg-zinc-900/50 dark:border-red-900/50 transition-colors duration-300">
          <h3 className="text-xl font-semibold mb-6 text-slate-900 dark:text-slate-100">Recent Task Executions</h3>
          <div className="space-y-4">
            {recentActions.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 dark:bg-black/50 dark:border-red-900/30 space-y-3 sm:space-y-0 transition-colors duration-300">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    item.status === 'Running' ? 'bg-blue-100 text-blue-600 dark:bg-red-500/10 dark:text-red-500' : 
                    item.status === 'Failed' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500' : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {item.status === 'Running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">{item.action}</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">{item.time}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded inline-block text-center ${
                   item.status === 'Running' ? 'bg-blue-100 text-blue-700 dark:bg-red-500/20 dark:text-red-400' : 
                   item.status === 'Failed' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm dark:bg-zinc-900/50 dark:border-red-900/50 transition-colors duration-300">
          <h3 className="text-xl font-semibold mb-6 text-slate-900 dark:text-slate-100">System Health</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-zinc-400">Memory Usage</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">42%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 dark:bg-red-600 w-[42%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-zinc-400">Storage</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">12GB / 50GB</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 dark:bg-orange-500 w-[24%]"></div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl transition-colors duration-300">
              <p className="text-xs text-blue-700 dark:text-red-300 leading-relaxed font-medium">
                All systems operational. No significant latency detected in pipelines.
              </p>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
