'use client';

import React, { useEffect, useState } from 'react';

const INITIAL_STOCKS = [
  "AAPL", "ARM", "ADSK", "AMD", "AVGO", "BABA", "BROS", "CL", "COIN", 
  "GOOG", "INTC", "MSFT", "NVDA", "ORCL", "PG", "QCOM", "SOUN", "TSLA", 
  "TSM", "TXN", "XOM"
];

export default function Home() {
  const [signals, setSignals] = useState<any[]>([]);
  const [trackedStocks, setTrackedStocks] = useState<string[]>(INITIAL_STOCKS);
  const [newStock, setNewStock] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket dynamically
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || "localhost:8000";
    const protocol = process.env.NEXT_PUBLIC_BACKEND_URL ? "wss" : "ws";
    const httpProtocol = process.env.NEXT_PUBLIC_BACKEND_URL ? "https" : "http";
    
    const ws = new WebSocket(`${protocol}://${backendHost}/ws`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      try {
        const newSignal = JSON.parse(event.data);
        setSignals(prev => [newSignal, ...prev].slice(0, 50)); // Keep last 50
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    // Fetch initial signals
    fetch(`${httpProtocol}://${backendHost}/api/signals`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSignals(data);
        }
      })
      .catch(console.error);

    return () => ws.close();
  }, []);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStock && !trackedStocks.includes(newStock.toUpperCase())) {
      setTrackedStocks([...trackedStocks, newStock.toUpperCase()]);
      setNewStock("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 lg:p-12">
      <div className="w-full max-w-7xl font-mono text-sm">
        <div className="flex items-center justify-between mb-8 border-b border-slate-700/50 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight glow-text bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
              AI Quantitative Platform
            </h1>
            <p className="text-slate-400 mt-2">Institutional Grade Trading Assistant</p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-slate-300 font-semibold">{isConnected ? 'LIVE (WebSockets)' : 'DISCONNECTED'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Stocks */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4 text-white">Tracked Assets</h2>
              <form onSubmit={handleAddStock} className="flex mb-4">
                <input 
                  type="text" 
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Symbol (e.g. META)" 
                  className="bg-slate-900 border border-slate-700 rounded-l-lg px-3 py-2 w-full text-white outline-none focus:border-cyan-500"
                />
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-r-lg transition-colors font-bold">
                  +
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                {trackedStocks.map(stock => (
                  <span key={stock} className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-slate-300 font-semibold hover:border-cyan-500 transition-colors cursor-pointer">
                    {stock}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Signals */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-semibold mb-4 text-white">Live AI Signals</h2>
            
            <div className="glass-panel rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="p-4 font-semibold text-slate-300">Symbol</th>
                    <th className="p-4 font-semibold text-slate-300">Timeframe</th>
                    <th className="p-4 font-semibold text-slate-300">AI Assessment</th>
                    <th className="p-4 font-semibold text-slate-300">Score</th>
                    <th className="p-4 font-semibold text-slate-300">Action</th>
                    <th className="p-4 font-semibold text-slate-300">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Waiting for signals... Send a webhook or run the test script.
                      </td>
                    </tr>
                  ) : signals.map((signal: any, idx) => (
                    <tr key={signal.id || idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">{signal.symbol}</td>
                      <td className="p-4 text-slate-400">{signal.timeframe}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          signal.ai_assessment === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                          signal.ai_assessment === 'BEARISH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                          'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        }`}>
                          {signal.ai_assessment}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-24 bg-slate-800 rounded-full h-2.5 mr-3">
                            <div 
                              className={`h-2.5 rounded-full ${signal.hybrid_score > 70 ? 'bg-cyan-500' : 'bg-amber-500'}`} 
                              style={{ width: `${Math.min(100, Math.max(0, signal.hybrid_score))}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-slate-300">{Number(signal.hybrid_score).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-white">{signal.action_taken}</td>
                      <td className="p-4 text-slate-400 text-sm">
                        {new Date(signal.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
