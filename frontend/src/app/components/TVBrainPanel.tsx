'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TVSignal {
  ticker: string;
  action: string;
  confidence: number;
  entry: number;
  stop: number;
  target: number;
  rr_ratio: number;
  timeframe: string;
  reasoning: string;
}

interface Phase { id: string; label: string; done: boolean; active: boolean; }

const PHASES: Phase[] = [
  { id: 'technical',    label: 'Technical',    done: false, active: false },
  { id: 'fundamentals', label: 'Fundamentals', done: false, active: false },
  { id: 'quant',        label: 'Quant Brain',  done: false, active: false },
  { id: 'claude',       label: 'Claude',       done: false, active: false },
];

const ACTION_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  STRONG_BUY:  { bg: 'rgba(34,211,168,0.12)',  text: '#22d3a8', border: 'rgba(34,211,168,0.4)' },
  BUY:         { bg: 'rgba(34,211,168,0.07)',  text: '#22d3a8', border: 'rgba(34,211,168,0.25)' },
  WATCH:       { bg: 'rgba(56,189,248,0.08)',  text: '#38bdf8', border: 'rgba(56,189,248,0.3)' },
  IGNORE:      { bg: 'rgba(100,116,139,0.08)', text: '#64748b', border: '#1e222d' },
  SELL:        { bg: 'rgba(244,63,94,0.07)',   text: '#f43f5e', border: 'rgba(244,63,94,0.25)' },
  STRONG_SELL: { bg: 'rgba(244,63,94,0.12)',   text: '#f43f5e', border: 'rgba(244,63,94,0.4)' },
};

export default function TVBrainPanel({ ticker }: { ticker: string }) {
  const [phases, setPhases]           = useState<Phase[]>(PHASES.map(p => ({ ...p })));
  const [signal, setSignal]           = useState<TVSignal | null>(null);
  const [streaming, setStreaming]      = useState(false);
  const [status, setStatus]           = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [techContent, setTechContent]  = useState('');
  const [fundContent, setFundContent]  = useState('');
  const [quantContent, setQuantContent]= useState('');
  const [synthesis, setSynthesis]      = useState('');
  const [tvConnected, setTvConnected]  = useState<boolean | null>(null);
  const [errMsg, setErrMsg]            = useState('');
  const wsRef    = useRef<WebSocket | null>(null);
  const synthRef = useRef<HTMLDivElement>(null);

  // Poll TV MCP status once on mount
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
    fetch(`${base}/api/v1/tv/status`)
      .then(r => r.json())
      .then(d => setTvConnected(d.connected))
      .catch(() => setTvConnected(false));
  }, []);

  useEffect(() => {
    if (synthRef.current)
      synthRef.current.scrollTop = synthRef.current.scrollHeight;
  }, [synthesis]);

  const reset = () => {
    wsRef.current?.close();
    setPhases(PHASES.map(p => ({ ...p })));
    setSignal(null); setStreaming(false); setStatus('idle');
    setTechContent(''); setFundContent(''); setQuantContent('');
    setSynthesis(''); setErrMsg('');
  };

  const markPhase = (id: string, done: boolean) =>
    setPhases(prev => prev.map(p =>
      p.id === id ? { ...p, done, active: !done } :
      { ...p, active: false }
    ));

  const analyze = useCallback(() => {
    if (streaming) return;
    reset();
    setStreaming(true); setStatus('running');

    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
    const wsUrl = base.replace(/^http/, 'ws') + `/ws/tv-brain/${ticker}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'phase':
            setPhases(prev => prev.map(p => ({
              ...p,
              active: p.id === msg.id,
              done:   p.done || prev.findIndex(x => x.id === msg.id) >
                                prev.findIndex(x => x.id === p.id),
            })));
            break;
          case 'technical':
            markPhase('technical', true);
            setTechContent(msg.content || '');
            break;
          case 'fundamentals':
            markPhase('fundamentals', true);
            setFundContent(msg.content || '');
            break;
          case 'quant':
            markPhase('quant', true);
            setQuantContent(msg.content || '');
            break;
          case 'stream_chunk':
            markPhase('claude', false);
            setSynthesis(p => p + (msg.content || ''));
            break;
          case 'signal':
            markPhase('claude', true);
            setSignal(msg.data);
            break;
          case 'error':
            setErrMsg(msg.msg || 'Unknown error');
            setStatus('error');
            break;
          case 'done':
            setStatus('done');
            break;
        }
      } catch { /* non-JSON chunk */ }
    };

    ws.onclose = () => {
      setStreaming(false);
      setStatus(s => s === 'running' ? 'done' : s);
    };
    ws.onerror = () => {
      setStreaming(false);
      setStatus('error');
      setErrMsg('WebSocket error — is the backend running?');
    };
  }, [streaming, ticker]);

  // Auto-analyze when ticker changes (if previously done)
  useEffect(() => {
    if (status === 'done' || status === 'running') reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const sigStyle = signal ? (ACTION_STYLE[signal.action] ?? ACTION_STYLE.WATCH) : null;

  const renderMarkdown = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <p key={i} className="text-[#e2e8f0] font-medium text-xs mb-1">{line.replace(/\*\*/g,'')}</p>;
      if (line.startsWith('- '))
        return <p key={i} className="flex gap-1.5 text-[rgba(226,232,240,0.65)] text-[11px] mb-0.5">
          <span className="text-[#22d3a8] shrink-0 mt-0.5">›</span>{line.slice(2)}
        </p>;
      if (line.includes('**'))
        return <p key={i} className="text-[rgba(226,232,240,0.75)] text-[11px] mb-0.5"
          dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.+?)\*\*/g,'<span class="text-[#e2e8f0] font-medium">$1</span>')}} />;
      return line ? <p key={i} className="text-[rgba(226,232,240,0.65)] text-[11px] mb-0.5">{line}</p> : <div key={i} className="h-1.5" />;
    });

  return (
    <div className="bg-[#111318] border border-[#1e222d] rounded-xl flex flex-col overflow-hidden" style={{ minHeight: 580 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e222d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            streaming ? 'bg-[#22d3a8] animate-pulse' :
            status === 'done' ? 'bg-[#22d3a8]' :
            status === 'error' ? 'bg-[#f43f5e]' : 'bg-[#1e222d]'
          }`} />
          <span className="font-mono text-xs text-[#e2e8f0]">AI Brain Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          {tvConnected !== null && (
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
              tvConnected
                ? 'text-[#22d3a8] border-[rgba(34,211,168,0.3)] bg-[rgba(34,211,168,0.06)]'
                : 'text-[#64748b] border-[#1e222d] bg-transparent'
            }`}>
              {tvConnected ? '⬤ TV Connected' : '○ TV Standalone'}
            </span>
          )}
          <span className="font-mono text-[10px] text-[#64748b]">
            {status === 'idle' ? 'Ready' :
             status === 'running' ? 'Analysing…' :
             status === 'done' ? 'Complete' : 'Error'}
          </span>
        </div>
      </div>

      {/* Phase progress bar */}
      <div className="px-4 py-2.5 border-b border-[#1e222d] flex items-center gap-1 shrink-0">
        {phases.map((p, idx) => (
          <div key={p.id} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all flex-1 justify-center ${
              p.done   ? 'bg-[rgba(34,211,168,0.08)] text-[#22d3a8] border border-[rgba(34,211,168,0.2)]' :
              p.active ? 'bg-[rgba(56,189,248,0.08)] text-[#38bdf8] border border-[rgba(56,189,248,0.2)] animate-pulse' :
                         'bg-[#0a0c10] text-[#2a2f3e] border border-[#1e222d]'
            }`}>
              {p.done ? '✓ ' : p.active ? '◉ ' : ''}{p.label}
            </div>
            {idx < phases.length - 1 && (
              <span className="text-[#1e222d] text-[10px]">›</span>
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <div ref={synthRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {status === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-10">
            <div className="text-4xl opacity-20">◈</div>
            <p className="font-mono text-[11px] text-[#64748b] text-center">
              Multi-phase AI analysis<br/>Technical · Fundamentals · Quant · Claude
            </p>
            <button onClick={analyze}
              className="mt-2 px-5 py-2 rounded-lg bg-[rgba(34,211,168,0.08)] border border-[rgba(34,211,168,0.3)] text-[#22d3a8] font-mono text-xs hover:bg-[rgba(34,211,168,0.15)] transition-all">
              Analyse {ticker}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-[rgba(244,63,94,0.06)] border border-[rgba(244,63,94,0.2)] rounded-lg p-3">
            <p className="font-mono text-[11px] text-[#f43f5e]">⚠ {errMsg}</p>
          </div>
        )}

        {/* Technical block */}
        {techContent && (
          <div className="bg-[#0a0c10] border border-[#1e222d] rounded-lg p-3">
            <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-2">📊 Technical</p>
            <div>{renderMarkdown(techContent)}</div>
          </div>
        )}

        {/* Fundamentals block */}
        {fundContent && (
          <div className="bg-[#0a0c10] border border-[#1e222d] rounded-lg p-3">
            <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-2">🏢 Fundamentals</p>
            <div>{renderMarkdown(fundContent)}</div>
          </div>
        )}

        {/* Quant block */}
        {quantContent && (
          <div className="bg-[#0a0c10] border border-[#1e222d] rounded-lg p-3">
            <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-2">🧠 Quant Brain</p>
            <div>{renderMarkdown(quantContent)}</div>
          </div>
        )}

        {/* Claude synthesis */}
        {(synthesis || (streaming && phases[3]?.active)) && (
          <div className="bg-[#0a0c10] border border-[#1e222d] rounded-lg p-3">
            <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-2">✨ Claude Synthesis</p>
            <p className="text-[rgba(226,232,240,0.75)] text-[11px] leading-relaxed whitespace-pre-wrap">
              {synthesis}
              {streaming && phases[3]?.active && <span className="terminal-cursor ml-0.5" />}
            </p>
          </div>
        )}

        {/* Signal card */}
        {signal && sigStyle && (
          <div className="rounded-xl border p-4 space-y-3"
            style={{ background: sigStyle.bg, borderColor: sigStyle.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px]" style={{ color: sigStyle.text }}>
                  {signal.ticker} · {signal.timeframe}
                </span>
              </div>
              <span className="font-mono text-sm font-bold tracking-wide"
                style={{ color: sigStyle.text }}>
                {signal.action.replace('_', ' ')}
              </span>
            </div>

            {/* Confidence bar */}
            <div>
              <div className="flex justify-between font-mono text-[9px] text-[#64748b] mb-1">
                <span>Confidence</span><span>{signal.confidence}%</span>
              </div>
              <div className="h-1 bg-[#1e222d] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${signal.confidence}%`, background: sigStyle.text }} />
              </div>
            </div>

            {/* Entry / Stop / Target */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Entry',  value: signal.entry,  color: '#38bdf8' },
                { label: 'Stop',   value: signal.stop,   color: '#f43f5e' },
                { label: 'Target', value: signal.target, color: '#22d3a8' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0a0c10] rounded-lg p-2 text-center border border-[#1e222d]">
                  <p className="font-mono text-[8px] text-[#64748b] uppercase mb-0.5">{label}</p>
                  <p className="font-mono text-xs font-bold" style={{ color }}>
                    ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#1e222d]">
              <span className="font-mono text-[9px] text-[#64748b]">Risk / Reward</span>
              <span className="font-mono text-xs font-bold" style={{ color: sigStyle.text }}>
                1 : {signal.rr_ratio}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-2.5 border-t border-[#1e222d] flex items-center gap-2 shrink-0">
        <button onClick={analyze} disabled={streaming}
          className="flex-1 py-1.5 rounded-md bg-[rgba(34,211,168,0.07)] border border-[rgba(34,211,168,0.3)] text-[#22d3a8] font-mono text-[11px] hover:bg-[rgba(34,211,168,0.15)] disabled:opacity-40 transition-colors">
          {streaming ? 'Analysing…' : status === 'done' ? '↺ Re-analyse' : `Analyse ${ticker}`}
        </button>
        {status !== 'idle' && (
          <button onClick={reset}
            className="px-3 py-1.5 rounded-md border border-[#1e222d] text-[#64748b] font-mono text-[11px] hover:text-[#e2e8f0] transition-colors">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
