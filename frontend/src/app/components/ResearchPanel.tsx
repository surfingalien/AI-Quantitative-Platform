'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function ResearchPanel({ ticker, onTickerChange }: { ticker: string; onTickerChange: (t: string) => void }) {
  const [input, setInput]     = useState(ticker);
  const [output, setOutput]   = useState('');
  const [streaming, setStream]= useState(false);
  const [status, setStatus]   = useState('Ready');
  const wsRef  = useRef<WebSocket | null>(null);
  const bodyRef= useRef<HTMLDivElement>(null);

  useEffect(() => { setInput(ticker); }, [ticker]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [output]);

  const startResearch = useCallback(() => {
    if (streaming) return;
    const t = input.trim().toUpperCase() || ticker;
    onTickerChange(t);
    setOutput(''); setStream(true); setStatus('Connecting…');

    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
    const wsUrl = base.replace(/^http/, 'ws') + `/ws/research/${t}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen    = () => setStatus('Streaming…');
    ws.onmessage = e => setOutput(p => p + e.data);
    ws.onclose   = () => { setStream(false); setStatus('Complete'); };
    ws.onerror   = () => { setStream(false); setStatus('Error — is backend running?'); };
  }, [streaming, input, ticker, onTickerChange]);

  const clear = () => {
    wsRef.current?.close();
    setOutput(''); setStream(false); setStatus('Ready');
  };

  const renderLine = (line: string, i: number) => {
    if (line.startsWith('## '))
      return <p key={i} className="text-[#e2e8f0] text-xs font-medium mt-3 mb-1">{line.replace('## ','')}</p>;
    if (line.startsWith('- '))
      return <p key={i} className="flex gap-2 text-[rgba(226,232,240,0.7)] text-xs mb-1"><span className="text-[#22d3a8] shrink-0">›</span>{line.replace('- ','')}</p>;
    if (line.startsWith('⚠️'))
      return <p key={i} className="text-[#64748b] text-[10px] mt-3 pt-2 border-t border-[#1e222d]">{line}</p>;
    if (line === '---')
      return <hr key={i} className="border-[#1e222d] my-2" />;
    if (line.startsWith('🔍') || line.startsWith('🧠'))
      return <p key={i} className="text-[#64748b] text-[10px]">{line}</p>;
    return <p key={i} className="text-[rgba(226,232,240,0.7)] text-xs leading-relaxed">{line}</p>;
  };

  return (
    <div className="bg-[#111318] border border-[#1e222d] rounded-xl flex flex-col h-[580px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e222d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${streaming ? 'bg-[#22d3a8] animate-pulse' : 'bg-[#1e222d]'}`} />
          RAG Research Brain
        </div>
        <span className="font-mono text-[10px] text-[#64748b]">{status}</span>
      </div>

      {/* Input */}
      <div className="px-4 py-2.5 border-b border-[#1e222d] flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && startResearch()}
          placeholder="Ticker — NVDA, BTC-USD, SPY…"
          className="flex-1 bg-[#0a0c10] border border-[#1e222d] rounded-md text-[#e2e8f0] font-mono text-xs px-3 py-1.5 outline-none focus:border-[rgba(34,211,168,0.5)] placeholder:text-[#64748b] transition-colors"
        />
        <button onClick={startResearch} disabled={streaming}
          className="px-4 py-1.5 rounded-md bg-[rgba(34,211,168,0.07)] border border-[rgba(34,211,168,0.3)] text-[#22d3a8] font-mono text-[11px] hover:bg-[rgba(34,211,168,0.15)] disabled:opacity-40 transition-colors">
          {streaming ? '…' : 'Research'}
        </button>
        {output && <button onClick={clear} className="px-3 py-1.5 rounded-md border border-[#1e222d] text-[#64748b] font-mono text-[11px] hover:text-[#e2e8f0] transition-colors">✕</button>}
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {!output && !streaming && (
          <p className="text-[#64748b] text-xs font-mono italic">Enter a ticker to generate an AI research report…</p>
        )}
        {output && output.split('\n').map((line, i) => renderLine(line, i))}
        {streaming && output && <span className="terminal-cursor" />}
      </div>
    </div>
  );
}
