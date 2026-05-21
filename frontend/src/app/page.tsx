'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertCircle, Zap, Activity, BarChart3, Wallet, Settings, Menu, X } from 'lucide-react';

const INITIAL_STOCKS = [
  "AAPL", "ARM", "ADSK", "AMD", "AVGO", "BABA", "BROS", "CL", "COIN",
  "GOOG", "INTC", "MSFT", "NVDA", "ORCL", "PG", "QCOM", "SOUN", "TSLA",
  "TSM", "TXN", "XOM", "BTC", "ETH", "SOL", "LINK"
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface StatCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
  change?: number;
  color?: string;
}

interface Signal {
  id?: string;
  symbol: string;
  timeframe?: string;
  ai_assessment?: 'BUY' | 'SELL' | 'HOLD';
  confidence?: number;
  hybrid_score?: number;
  action_taken?: string;
  timestamp?: string;
}

const StatCard = ({ icon: Icon, label, value, change, color = 'emerald' }: StatCardProps) => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'rgb(16 185 129 / 0.2)', border: 'rgb(16 185 129 / 0.3)', text: 'rgb(52 211 153)' },
    blue: { bg: 'rgb(59 130 246 / 0.2)', border: 'rgb(59 130 246 / 0.3)', text: 'rgb(96 165 250)' },
    purple: { bg: 'rgb(139 92 246 / 0.2)', border: 'rgb(139 92 246 / 0.3)', text: 'rgb(168 85 247)' },
  };
  const colorStyle = colorMap[color] || colorMap.emerald;

  return (
    <motion.div
      variants={itemVariants}
      className="glass-panel p-6 rounded-2xl card-hover"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
        <div className="p-3 rounded-full border" style={{ backgroundColor: colorStyle.bg, borderColor: colorStyle.border }}>
          <Icon className="w-6 h-6" style={{ color: colorStyle.text }} />
        </div>
      </div>
    </motion.div>
  );
};

const SignalBadge = ({ type }: { type: 'BUY' | 'SELL' | 'HOLD' }) => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    BUY: { bg: 'rgb(16 185 129 / 0.2)', border: 'rgb(16 185 129 / 0.3)', text: 'rgb(52 211 153)' },
    SELL: { bg: 'rgb(239 68 68 / 0.2)', border: 'rgb(239 68 68 / 0.3)', text: 'rgb(248 113 113)' },
    HOLD: { bg: 'rgb(217 119 6 / 0.2)', border: 'rgb(217 119 6 / 0.3)', text: 'rgb(251 146 60)' },
  };
  const colorStyle = colorMap[type];

  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap" style={{ backgroundColor: colorStyle.bg, borderColor: colorStyle.border, color: colorStyle.text }}>
      {type}
    </span>
  );
};

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trackedStocks, setTrackedStocks] = useState<string[]>(INITIAL_STOCKS);
  const [newStock, setNewStock] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('signals');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats] = useState({
    totalTrades: 247,
    winRate: 62.5,
    totalReturn: 32100,
    exposure: 45.2,
  });

  useEffect(() => {
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || "localhost:8000";
    const protocol = process.env.NEXT_PUBLIC_BACKEND_URL ? "wss" : "ws";
    const httpProtocol = process.env.NEXT_PUBLIC_BACKEND_URL ? "https" : "http";

    const ws = new WebSocket(`${protocol}://${backendHost}/ws`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const newSignal = JSON.parse(event.data);
        setSignals(prev => [newSignal, ...prev].slice(0, 50));
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    fetch(`${httpProtocol}://${backendHost}/api/signals`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSignals(data);
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

  const tabs = [
    { id: 'signals', label: 'Live Signals', icon: Zap },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-700/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold glow-text">AI Quantitative</h1>
                <p className="text-xs text-slate-400">Trading Platform</p>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* Status Badge */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="status-live hidden md:flex"
            >
              <div className="status-dot" />
              <span className="text-sm font-semibold">
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 space-y-2"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-left ${
                      activeTab === tab.id
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard icon={Activity} label="Total Trades" value={stats.totalTrades} change={12.5} color="emerald" />
          <StatCard icon={TrendingUp} label="Win Rate" value={`${stats.winRate}%`} change={2.3} color="blue" />
          <StatCard icon={Wallet} label="Total Return" value={`$${(stats.totalReturn / 1000).toFixed(0)}k`} change={8.7} color="purple" />
          <StatCard icon={AlertCircle} label="Exposure" value={`${stats.exposure}%`} change={-3.2} color="amber" />
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Signals Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'signals' && (
              <motion.div
                key="signals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-6"
              >
                {/* Tracked Assets */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                  <div className="glass-panel p-6 rounded-2xl card-hover sticky top-24">
                    <h2 className="text-xl font-semibold mb-4 text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Tracked Assets</span>
                    </h2>
                    <form onSubmit={handleAddStock} className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        placeholder="Symbol"
                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-slate-800 transition-colors"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all font-bold"
                      >
                        +
                      </motion.button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                      {trackedStocks.map(stock => (
                        <motion.span
                          key={stock}
                          whileHover={{ scale: 1.05 }}
                          className="bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 px-3 py-1 rounded-lg text-slate-300 font-semibold transition-colors cursor-pointer text-sm"
                        >
                          {stock}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Signals Table */}
                <motion.div variants={itemVariants} className="lg:col-span-3">
                  <div className="glass-panel rounded-2xl overflow-hidden card-hover">
                    <div className="p-6 border-b border-slate-700/30 flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-xl font-semibold text-white">Live AI Signals</h2>
                      <span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        {signals.length} active
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-700/30 bg-slate-800/20">
                            <th className="p-4 font-semibold text-slate-300 text-sm">Symbol</th>
                            <th className="p-4 font-semibold text-slate-300 text-sm">Timeframe</th>
                            <th className="p-4 font-semibold text-slate-300 text-sm">AI Assessment</th>
                            <th className="p-4 font-semibold text-slate-300 text-sm">Score</th>
                            <th className="p-4 font-semibold text-slate-300 text-sm">Action</th>
                            <th className="p-4 font-semibold text-slate-300 text-sm">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {signals.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500">
                                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="flex flex-col items-center space-y-2">
                                  <Zap className="w-8 h-8 text-slate-700" />
                                  <p>Waiting for signals...</p>
                                </motion.div>
                              </td>
                            </tr>
                          ) : (
                            signals.map((signal: Signal, idx) => (
                              <motion.tr
                                key={signal.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="p-4 font-bold text-white">{signal.symbol}</td>
                                <td className="p-4 text-slate-400 text-sm">{signal.timeframe || '1h'}</td>
                                <td className="p-4">
                                  <SignalBadge type={signal.ai_assessment || 'HOLD'} score={signal.confidence} />
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, Math.max(0, signal.hybrid_score || 0))}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className={`h-full ${(signal.hybrid_score || 0) > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                      />
                                    </div>
                                    <span className="text-sm text-slate-300">{Number(signal.hybrid_score || 0).toFixed(1)}</span>
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-white">{signal.action_taken || 'EXECUTED'}</td>
                                <td className="p-4 text-slate-400 text-sm">
                                  {new Date(signal.timestamp || Date.now()).toLocaleTimeString()}
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="glass-panel p-8 rounded-2xl card-hover">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Wallet className="w-6 h-6 text-blue-400" />
                    <span>Portfolio Overview</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/30 p-6 rounded-xl">
                      <p className="text-slate-400 mb-2">Total Value</p>
                      <p className="text-4xl font-bold text-white">$132,450</p>
                      <p className="text-emerald-400 mt-2">↑ 12.3% this month</p>
                    </div>
                    <div className="bg-slate-800/30 p-6 rounded-xl">
                      <p className="text-slate-400 mb-2">Available Cash</p>
                      <p className="text-4xl font-bold text-white">$18,900</p>
                      <p className="text-slate-400 mt-2">14.3% of total</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="glass-panel p-8 rounded-2xl card-hover">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                    <span>Performance Analytics</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/30 p-4 rounded-xl">
                      <p className="text-slate-400 text-sm mb-1">Daily P&L</p>
                      <p className="text-2xl font-bold text-emerald-400">+$1,245</p>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-xl">
                      <p className="text-slate-400 text-sm mb-1">Best Trade</p>
                      <p className="text-2xl font-bold text-blue-400">$4,320</p>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-xl">
                      <p className="text-slate-400 text-sm mb-1">Sharpe Ratio</p>
                      <p className="text-2xl font-bold text-purple-400">1.68</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="glass-panel p-8 rounded-2xl card-hover">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Settings className="w-6 h-6 text-slate-400" />
                    <span>Configuration</span>
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-slate-800/30 p-4 rounded-xl">
                      <p className="text-white font-semibold mb-2">Risk Per Trade</p>
                      <p className="text-slate-400">1% ($1,000 on $100,000 account)</p>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-xl">
                      <p className="text-white font-semibold mb-2">Max Position Size</p>
                      <p className="text-slate-400">5% of portfolio</p>
                    </div>
                    <div className="bg-slate-800/30 p-4 rounded-xl">
                      <p className="text-white font-semibold mb-2">Trading Mode</p>
                      <p className="text-emerald-400">Paper Trading (Safe)</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 border-t border-slate-700/30 mt-16 py-8 bg-slate-950/50 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <p>&copy; 2026 AI Quantitative Platform. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
