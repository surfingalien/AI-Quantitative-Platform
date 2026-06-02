'use client';
import { useEffect, useState } from 'react';

interface QuantData { ticker: string; trend: string; volatility: string; confidence: number; }

export default function QuantMetrics({ ticker }: { ticker: string }) {
  const [data, setData]       = useState<QuantData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true); setError(null);
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
    fetch(`${base}/api/v1/quant/predict/${ticker}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(j => { if (!cancelled) { setData(j); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [ticker]);

  const Metric = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="bg-[#0a0c10] border border-[#1e222d] rounded-lg p-3 text-center">
      <p className="font-mono text-[9px] text-[#64748b] uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-mono text-lg font-bold transition-colors ${color}`}>
        {loading ? <span className="inline-block w-14 h-4 bg-[#1e222d] rounded animate-pulse" /> : value}
      </p>
    </div>
  );

  const trendColor = !data ? 'text-[#64748b]' : data.trend === 'BULLISH' ? 'text-[#22d3a8]' : 'text-[#f43f5e]';
  const volColor   = !data ? 'text-[#64748b]' : data.volatility === 'HIGH' ? 'text-[#f43f5e]' : data.volatility === 'MEDIUM' ? 'text-[#f59e0b]' : 'text-[#22d3a8]';
  const confColor  = !data ? 'text-[#64748b]' : data.confidence > 70 ? 'text-[#22d3a8]' : data.confidence > 50 ? 'text-[#38bdf8]' : 'text-[#f59e0b]';

  return (
    <div className="space-y-2 mt-3">
      {error && <p className="text-[10px] text-[#f43f5e] font-mono">⚠ {error} — is the backend running?</p>}
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Trend"      value={data?.trend      ?? '—'} color={trendColor} />
        <Metric label="Volatility" value={data?.volatility ?? '—'} color={volColor}   />
        <Metric label="Confidence" value={data ? `${data.confidence}%` : '—'} color={confColor} />
      </div>
      <p className="text-[9px] text-[#64748b] font-mono">Quant Brain · PyTorch Transformer · {ticker}</p>
    </div>
  );
}
