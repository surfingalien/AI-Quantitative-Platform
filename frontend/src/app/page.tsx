'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import QuantMetrics from './components/QuantMetrics';
import ResearchPanel from './components/ResearchPanel';

const TradingViewChart = dynamic(() => import('./components/TradingViewChart'), { ssr: false });

const TICKERS = ['AAPL','NVDA','MSFT','SPY','BTC-USD','QQQ','TSLA','GOOGL'];

export default function Home() {
  const [ticker, setTicker] = useState('AAPL');

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-13 border-b border-[#1e222d] bg-[rgba(10,12,16,0.85)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-13 flex items-center justify-between" style={{height:'52px'}}>
          <div className="flex items-center gap-2">
            <span className="text-[#22d3a8] text-xl">◈</span>
            <span className="text-[#e2e8f0] text-[17px]" style={{fontFamily:"'DM Serif Display',Georgia,serif"}}>AI Finance Brain</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#64748b] border border-[#1e222d] px-2 py-1 rounded">v1.0</span>
            <div className="w-7 h-7 rounded-full bg-[#1e222d] border border-[#2a2f3e] flex items-center justify-center font-mono text-[10px] text-[#64748b]">SU</div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-10">
        {/* Hero */}
        <div className="mb-5">
          <h1 className="gradient-text text-4xl leading-tight mb-1" style={{fontFamily:"'DM Serif Display',Georgia,serif"}}>AI Finance Brain</h1>
          <p className="font-mono text-[11px] text-[#64748b] tracking-wide">Multi-modal intelligence · RAG Research + Quant Forecasting</p>
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

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Chart + Quant */}
          <div className="space-y-4">
            <div className="bg-[#111318] border border-[#1e222d] rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[#e2e8f0] text-lg" style={{fontFamily:"'DM Serif Display',Georgia,serif"}}>{ticker}</h2>
                  <p className="font-mono text-[10px] text-[#64748b]">Technical Analysis · Quant Brain</p>
                </div>
                <span className="font-mono text-[10px] text-[#64748b] border border-[#1e222d] px-2 py-1 rounded">1D · OHLCV</span>
              </div>
              <TradingViewChart ticker={ticker} />
              <QuantMetrics ticker={ticker} />
            </div>

            {/* Info panels */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111318] border border-[#1e222d] rounded-xl p-4">
                <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-3">Components</p>
                {[['#22d3a8','RAG Research Brain'],['#38bdf8','Quant Transformer'],['#f59e0b','Qdrant Vector DB'],['#64748b','Ollama / Claude API']].map(([c,l])=>(
                  <div key={l} className="flex items-center gap-2 font-mono text-[10px] text-[rgba(226,232,240,0.6)] mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:c}} />{l}
                  </div>
                ))}
              </div>
              <div className="bg-[#111318] border border-[#1e222d] rounded-xl p-4">
                <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-3">Stack</p>
                {['FastAPI · Python 3.10','PyTorch Transformer','Next.js 14 · TypeScript','Claude Sonnet · Finnhub'].map(l=>(
                  <div key={l} className="flex items-center gap-2 font-mono text-[10px] text-[rgba(226,232,240,0.6)] mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1e222d] shrink-0" />{l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Research */}
          <ResearchPanel ticker={ticker} onTickerChange={setTicker} />
        </div>

        <footer className="text-center font-mono text-[10px] text-[#64748b] mt-8 pt-5 border-t border-[#1e222d]">
          AI Finance Brain · Not financial advice · For research purposes only
        </footer>
      </main>
    </div>
  );
}
