'use client';
import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, Time } from 'lightweight-charts';

function generateMockCandles(ticker: string, count = 90): CandlestickData<Time>[] {
  const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let price = 100 + (seed % 400);
  const candles: CandlestickData<Time>[] = [];
  const today = new Date();
  for (let i = count; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const move = (Math.sin(i * 0.3 + seed) * 0.5 + (Math.random() - 0.47)) * price * 0.022;
    const open = price, close = price + move;
    const high = Math.max(open, close) + Math.random() * price * 0.009;
    const low  = Math.min(open, close) - Math.random() * price * 0.009;
    candles.push({ time: d.toISOString().slice(0,10) as Time, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) });
    price = close;
  }
  return candles;
}

export default function TradingViewChart({ ticker }: { ticker: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'mock' | 'loading'>('loading');
  const [lastPrice, setLastPrice]   = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0c10' },
        textColor: '#64748b',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      width:  containerRef.current.clientWidth,
      height: 280,
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        vertLine: { color: '#22d3a840', labelBackgroundColor: '#22d3a8' },
        horzLine: { color: '#22d3a840', labelBackgroundColor: '#22d3a8' },
      },
      rightPriceScale: { borderColor: '#1e222d' },
      timeScale:       { borderColor: '#1e222d', barSpacing: 7 },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor:      '#22d3a8',
      downColor:    '#f43f5e',
      borderVisible: false,
      wickUpColor:   '#22d3a8',
      wickDownColor: '#f43f5e',
    });

    setDataSource('loading');
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

    fetch(`${base}/api/v1/chart/${ticker}?period=3mo&interval=1d`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((bars: CandlestickData<Time>[]) => {
        if (!bars || bars.length === 0) throw new Error('empty');
        series.setData(bars);
        chart.timeScale().fitContent();
        const last = bars[bars.length - 1];
        setLastPrice(last.close as number);
        setDataSource('live');
      })
      .catch(() => {
        series.setData(generateMockCandles(ticker));
        chart.timeScale().fitContent();
        setDataSource('mock');
      });

    const onResize = () => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.remove(); };
  }, [ticker]);

  return (
    <div>
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden border border-[#1e222d]" />
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${
            dataSource === 'live'    ? 'bg-[#22d3a8]' :
            dataSource === 'loading' ? 'bg-[#f59e0b] animate-pulse' : 'bg-[#64748b]'
          }`} />
          <span className="font-mono text-[10px] text-[#64748b]">
            {dataSource === 'live'    ? 'Live OHLCV · yfinance' :
             dataSource === 'loading' ? 'Loading…' : 'Mock data · backend offline'}
          </span>
        </div>
        {lastPrice && (
          <span className="font-mono text-[10px] text-[#22d3a8]">
            Last ${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  );
}
