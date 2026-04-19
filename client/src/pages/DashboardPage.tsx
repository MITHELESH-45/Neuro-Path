import React, { useEffect, useState } from 'react';
import { Activity, Zap, Database, RotateCcw, Play, FileText, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

const DashboardPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = getCookie('token');
      const res = await axios.get('http://localhost:5000/api/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const stats = [
    { label: 'Total Automations Run', value: data?.totalRuns || 0, icon: Activity, color: 'text-blue-400' },
    { label: 'Success Rate (%)', value: `${data?.successRate || 0}%`, icon: Zap, color: data?.successRate >= 80 ? 'text-emerald-400' : (data?.successRate > 0 ? 'text-amber-400' : 'text-slate-400') },
    { label: 'Active Sessions', value: data?.activeSessionsCount || 0, icon: Database, color: 'text-purple-400' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-black overflow-hidden transition-colors duration-300">
      <Navbar />
      <div className="flex-grow overflow-y-auto w-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Analytics Dashboard</h1>
              <p className="text-slate-500 dark:text-zinc-400">Monitor your agent execution metrics and history.</p>
            </div>
            <button 
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm dark:bg-zinc-900 dark:border-red-900/50 dark:text-slate-300 dark:hover:bg-zinc-800 transition-colors duration-300 disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm dark:bg-zinc-900/50 dark:border-red-900/50 transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium tracking-wider">ALL-TIME</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {loading ? '...' : stat.value}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {/* Recent Extractions Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm dark:bg-zinc-900/50 dark:border-red-900/50 transition-colors duration-300">
              <h3 className="text-xl font-semibold mb-6 text-slate-900 dark:text-slate-100 flex items-center">
                <FileText className="w-5 h-5 mr-3 text-blue-500" />
                Recent Extractions
              </h3>
              
              {loading ? (
                <div className="text-center py-8 text-slate-500 dark:text-zinc-500">Loading Extractions...</div>
              ) : data?.recentExtractions?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-zinc-800 text-sm text-slate-500 dark:text-zinc-400">
                        <th className="pb-3 px-2 font-medium">Date</th>
                        <th className="pb-3 px-2 font-medium">Task / Target URL</th>
                        <th className="pb-3 px-2 font-medium">Engine</th>
                        <th className="pb-3 px-2 font-medium text-center">Retries</th>
                        <th className="pb-3 px-2 font-medium text-center">Vision</th>
                        <th className="pb-3 px-2 font-medium text-center">CAPTCHA</th>
                        <th className="pb-3 px-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                      {data.recentExtractions.map((item: any) => (
                        <tr 
                          key={item.id} 
                          className={`group transition-colors ${item.metadata ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/40' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/40'}`}
                          onClick={() => item.metadata && setSelectedMetadata(item.metadata)}
                        >
                          <td className="py-4 px-2 whitespace-nowrap text-sm text-slate-500 dark:text-zinc-500">
                            {new Date(item.date).toLocaleDateString()} <br/>
                            <span className="text-xs">{new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-start space-x-2 max-w-xs">
                              <Globe className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2" title={item.task}>
                                {item.task}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-2">
                               <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                 {item.recovery?.engine || 'N/A'}
                               </span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center text-sm font-mono dark:text-zinc-300">
                            {item.recovery?.retries || 0}
                          </td>
                          <td className="py-4 px-2 text-center">
                            {item.recovery?.visionUsed ? 
                              <span className="text-blue-500 text-xs font-bold">YES</span> : 
                              <span className="text-slate-300 dark:text-zinc-700 text-xs text-center">—</span>
                            }
                          </td>
                          <td className="py-4 px-2 text-center">
                            {item.recovery?.captchaDetected ? 
                              <span className="text-orange-500 text-xs font-bold">DET</span> : 
                              <span className="text-slate-300 dark:text-zinc-700 text-xs text-center">—</span>
                            }
                          </td>
                          <td className="py-4 px-2 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                               item.data.startsWith('Error') 
                               ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' 
                               : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            }`}>
                              {item.data.startsWith('Error') ? 'FAILED' : 'SUCCESS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-black/30 rounded-xl border border-dashed border-slate-300 dark:border-zinc-800">
                  <Play className="w-8 h-8 text-slate-400 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-500 dark:text-zinc-500">No successful extractions yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Head over to the Agent Console to run your first task!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Metadata Detail Modal */}
      {selectedMetadata && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-red-900/50 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
               <div>
                  <h3 className="text-xl font-bold dark:text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-500 dark:text-red-500" /> 
                    Execution Plan Metadata
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">The structured reasoning tree utilized by the Agent to fulfill this task.</p>
               </div>
              <button 
                onClick={() => setSelectedMetadata(null)} 
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
               >
                Close
              </button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-6">
              {selectedMetadata.recovery && (
                <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-red-900/20">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Recovery Timeline</h4>
                  <div className="space-y-2">
                    {selectedMetadata.recovery.timeline?.map((event: string, i: number) => (
                      <div key={i} className="flex items-start space-x-3 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                        <p className="dark:text-slate-300 font-mono italic">{event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Full Internal Plan</h4>
                <pre className="text-[10px] font-mono bg-slate-50 border border-slate-200 shadow-inner dark:bg-zinc-950 dark:border-red-900/30 p-4 rounded-xl text-blue-800 dark:text-red-400 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedMetadata.planner || selectedMetadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
