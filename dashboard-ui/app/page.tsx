'use client';

import { useEffect, useState } from 'react';
import { useAnalyticsStore } from './stores/useAnalyticsStore.js';
import { 
  Activity, 
  Clock, 
  Users, 
  Shield, 
  RefreshCw, 
  AlertCircle, 
  ArrowUpRight 
} from 'lucide-react';

export default function Home() {
  const {
    tenantName,
    totalRequests,
    avgLatency,
    uniqueVisitor,
    statusCodes,
    recentEvents,
    loading,
    error,
    fetchStats,
  } = useAnalyticsStore();

  const [isLive, setIsLive] = useState(true);

  // 1. Initial Load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 2. Live Polling Interval (every 2 seconds)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      fetchStats();
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, fetchStats]);

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner / Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-600/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Aegis Analytics Engine
              </h1>
              <p className="text-xs text-zinc-400">
                Tenant: <span className="text-zinc-200 font-medium">{tenantName || 'Loading...'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Status indicator */}
            <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50' : 'bg-zinc-500'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                {isLive ? 'Live Streaming' : 'Paused'}
              </span>
            </div>

            {/* Poll Toggle Switch */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 flex items-center gap-2 ${
                isLive
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLive ? 'animate-spin' : ''}`} />
              {isLive ? 'Pause Stream' : 'Resume Stream'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error message handling */}
        {error && (
          <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-200">Database/Server Connection Error</h3>
              <p className="text-sm text-rose-300/80 mt-1">{error}</p>
              <p className="text-xs text-rose-400/60 mt-2">Make sure PostgreSQL (port 5433), Redis (port 6379), and the worker are all running.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Requests */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/15 transition-all" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Total Ingested Requests</p>
                <h3 className="text-3xl font-extrabold mt-2 text-white tracking-tight">
                  {totalRequests.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-indigo-950/80 border border-indigo-800/40 text-indigo-400 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4 flex items-center gap-1">
              Accumulated in PostgreSQL <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>

          {/* Card 2: Average Latency */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/15 transition-all" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Avg Request Latency</p>
                <h3 className="text-3xl font-extrabold mt-2 text-white tracking-tight">
                  {avgLatency} <span className="text-lg font-medium text-zinc-500">ms</span>
                </h3>
              </div>
              <div className="p-3 bg-amber-950/80 border border-amber-800/40 text-amber-400 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Average API execution response time
            </p>
          </div>

          {/* Card 3: Unique Visitors */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Daily Unique Visitors</p>
                <h3 className="text-3xl font-extrabold mt-2 text-white tracking-tight">
                  {uniqueVisitor.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4 flex items-center gap-1.5">
              <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 uppercase font-mono font-semibold">Redis HLL</span> 
              Calculated using HyperLogLog (12KB ceiling)
            </p>
          </div>
        </section>

        {/* Details Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Codes Panel */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl lg:col-span-1 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">HTTP Status Distribution</h3>
              <p className="text-xs text-zinc-400 mt-1">Split between successful and rate-limited traffic</p>
            </div>
            <div className="space-y-4">
              {statusCodes.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">No traffic recorded yet.</p>
              ) : (
                statusCodes.map((status) => {
                  const count = parseInt(status.count, 10);
                  const isBlocked = status.status_code === 429;
                  const pct = Math.min(100, Math.max(5, (count / (totalRequests || 1)) * 100));

                  return (
                    <div key={status.status_code} className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBlocked 
                            ? 'bg-rose-950 border border-rose-800/50 text-rose-400' 
                            : 'bg-emerald-950 border border-emerald-800/50 text-emerald-400'
                        }`}>
                          HTTP {status.status_code}
                        </span>
                        <span className="text-zinc-300 font-mono font-semibold">{count} requests</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Logs Panel */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Live Activity Log</h3>
                <p className="text-xs text-zinc-400 mt-1">Telemetry stream populated by worker database ingestion</p>
              </div>
              {loading && <span className="text-xs text-zinc-500 animate-pulse">Syncing...</span>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-400 font-medium pb-2">
                    <th className="pb-3 w-16">Method</th>
                    <th className="pb-3">Path</th>
                    <th className="pb-3 w-28">Status</th>
                    <th className="pb-3 w-28">IP Hash</th>
                    <th className="pb-3 w-24 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {recentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">
                        No events processed by the worker yet. Send requests to see live telemetry!
                      </td>
                    </tr>
                  ) : (
                    recentEvents.map((event) => {
                      const isBlocked = event.status_code === 429;
                      const methodColor = 
                        event.method === 'GET' ? 'text-indigo-400 bg-indigo-950/60 border-indigo-900/50' :
                        event.method === 'POST' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-900/50' :
                        'text-amber-400 bg-amber-950/60 border-amber-900/50';

                      return (
                        <tr key={event.id} className="hover:bg-zinc-900/40 group transition-colors">
                          <td className="py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${methodColor}`}>
                              {event.method}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-zinc-300 font-medium group-hover:text-white transition-colors">
                            {event.path}
                          </td>
                          <td className="py-3">
                            <span className={`flex items-center gap-1.5 font-medium ${isBlocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              {isBlocked ? '429 Blocked' : '200 Allowed'}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-zinc-500">
                            {event.ip_hash.substring(0, 12)}...
                          </td>
                          <td className="py-3 text-right text-zinc-400 font-mono">
                            {formatTime(event.created_at)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
