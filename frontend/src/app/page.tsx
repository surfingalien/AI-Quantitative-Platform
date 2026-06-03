'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import QuantMetrics from './components/QuantMetrics';
import ResearchPanel from './components/ResearchPanel';
import TVBrainPanel from './components/TVBrainPanel';

const TradingViewChart = dynamic(() => import('./components/TradingViewChart'), { ssr: false });

const TICKERS = ['AAPL','NVDA','MSFT','SPY','BTC-USD','QQQ','TSLA','GOOGL'];

type RightTab = 'brain' | 'research';

export default function Home() {
  const [ticker, setTicker]     = useState('AAPL');
  const [rightTab, setRightTab] = useState<RightTab>('brain');

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-13 border-b border-[#1e222d] bg-[rgba(10,12,16,0.85)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between" style={{height:'52px'}}>
          <div className="flex items-center gap-2">
            <span className="text-[#22d3a8] text-xl">◈</span>
            <span className="text-[#e2e8f0] text-[17px]" style={{fontFamily:"'DM Serif Display',Georgia,serif"}}>AI Finance Brain</span>
            <span className="font-mono text-[9px] text-[#64748b] border border-[#1e222d] px-1.5 py-0.5 rounded ml-1">
              + TradingView MCP
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#64748b] border border-[#1e222d] px-2 py-1 rounded">v1.1</span>
            <div className="w-7 h-7 rounded-full bg-[#1e222d] border border-[#2a2f3e] flex items-center justify-center font-mono text-[10px] text-[#64748b]">SU</div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-10">
        {/* Hero */}
        <div className="mb-5">
          <h1 className="gradient-text text-4xl leading-tight mb-1" style={{fontFamily:"'DM Serif Display',Georgia,serif"}}>AI Finance Brain</h1>
          <p className="font-mono text-[11px] text-[#64748b] tracking-wide">
            Multi-modal intelligence · RAG Research · Quant Forecasting · TradingView MCP
          </p>
        </div>

        {/* Ticker bar */}
        <div className="flex gap-2 flex-wrap mb-5 items-center">
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)}
              className={`font-mono text-[11px] px-3 py-1.5 rounded-md border transition-all
                ${ticker === t
                  ? 'bg-[rgba(34,211,168,0.08)] border-[rgba(34,211,168,0.4)] text-[#22d3a8]'
                  : 'bg-[#0a0c10] border-[#1e222d] text-[#64748b] hover:text-[#e2e8f0] hover:border-[#2a2f3e]'}`}>
              {t}
            </button>
          ))}
          <span className="font-mono text-[10px] text-[#64748b]">· click to switch</span>
        </div>

        {/* Main grid: 55% left / 45% right */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-5">

          {/* ── Left column (6/11) ── */}
          <div className="lg:col-span-6 space-y-4">
            {/* Chart card */}
            <div className="bg-[#111318] border border-[#1e222d] rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[#e2e8f0] text-lg" style={{fontFamily:"'DM Serif Display',Georgia,serif"}}>{ticker}</h2>
                  <p className="font-mono text-[10px] text-[#64748b]">Price Chart · Real-time OHLCV</p>
                </div>
                <span className="font-mono text-[10px] text-[#64748b] border border-[#1e222d] px-2 py-1 rounded">1D · 3M</span>
              </div>
              <TradingViewChart ticker={ticker} />
            </div>

            {/* Quant metrics */}
            <div className="bg-[#111318] border border-[#1e222d] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="font-mono text-[10px] text-[#64748b]">Quant Brain · PyTorch Transformer</p>
                <span className="font-mono text-[9px] text-[#64748b] border border-[#1e222d] px-1.5 py-0.5 rounded">live inference</span>
              </div>
              <QuantMetrics ticker={ticker} />
            </div>

            {/* Info cards row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111318] border border-[#1e222d] rounded-xl p-4">
                <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-3">Components</p>
                {[
                  ['#22d3a8', 'AI Brain (Claude Sonnet)'],
                  ['#38bdf8', 'Quant Transformer'],
                  ['#a78bfa', 'TradingView MCP'],
                  ['#f59e0b', 'RAG Research Engine'],
                ].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-2 font-mono text-[10px] text-[rgba(226,232,240,0.6)] mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />{l}
                  </div>
                ))}
              </div>
              <div className="bg-[#111318] border border-[#1e222d] rounded-xl p-4">
                <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-3">Stack</p>
                {[
                  'FastAPI · Python 3.11',
                  'PyTorch · yfinance',
                  'Next.js 14 · TypeScript',
                  'Claude Sonnet · WebSocket',
                ].map(l => (
                  <div key={l} className="flex items-center gap-2 font-mono text-[10px] text-[rgba(226,232,240,0.6)] mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e222d] shrink-0" />{l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column (5/11) ── */}
          <div className="lg:col-span-5 flex flex-col gap-0">
            {/* Tab bar */}
            <div className="flex border-b border-[#1e222d] mb-0 bg-[#111318] rounded-t-xl overflow-hidden">
              {([
                { id: 'brain',    label: '◈ AI Brain Analysis' },
                { id: 'research', label: '🔍 RAG Research' },
              ] as { id: RightTab; label: string }[]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`flex-1 py-3 font-mono text-[11px] transition-all border-b-2 ${
                    rightTab === tab.id
                      ? 'text-[#22d3a8] border-[#22d3a8] bg-[rgba(34,211,168,0.04)]'
                      : 'text-[#64748b] border-transparent hover:text-[#e2e8f0]'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1">
              {rightTab === 'brain'
                ? <TVBrainPanel key={ticker} ticker={ticker} />
                : <ResearchPanel ticker={ticker} onTickerChange={setTicker} />
              }
            </div>
          </div>
        </div>

        <footer className="text-center font-mono text-[10px] text-[#64748b] mt-8 pt-5 border-t border-[#1e222d]">
          AI Finance Brain · TradingView MCP · Not financial advice · For research purposes only
        </footer>
      </main>
    </div>
  );
}
