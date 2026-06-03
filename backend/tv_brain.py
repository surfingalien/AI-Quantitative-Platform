# tv_brain.py — AI Finance Brain + TradingView MCP Integration
# Provides: real OHLCV chart data, multi-phase streaming AI analysis,
# and a trade setup (entry/stop/target) powered by Claude.

import asyncio
import json
import os
from datetime import datetime

import numpy as np
import yfinance as yf
from anthropic import Anthropic
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel


# ── Anthropic client ──────────────────────────────────────────────────────────
def _get_client() -> Anthropic:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    return Anthropic(api_key=key)


# ── Pydantic models ───────────────────────────────────────────────────────────
class OHLCVBar(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class TVSignal(BaseModel):
    ticker: str
    action: str          # STRONG_BUY | BUY | WATCH | IGNORE | SELL | STRONG_SELL
    confidence: float    # 0-100
    entry: float
    stop: float
    target: float
    rr_ratio: float
    timeframe: str
    reasoning: str


# ── Real OHLCV from yfinance ──────────────────────────────────────────────────
async def get_chart_data(ticker: str, period: str = "3mo", interval: str = "1d") -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch_ohlcv, ticker, period, interval)


def _fetch_ohlcv(ticker: str, period: str, interval: str) -> list:
    try:
        df = yf.download(ticker, period=period, interval=interval,
                         progress=False, auto_adjust=True)
        if df.empty:
            return []

        # Flatten MultiIndex columns if present
        if hasattr(df.columns, 'levels'):
            df.columns = df.columns.get_level_values(0)

        bars = []
        for ts, row in df.iterrows():
            try:
                t = ts.strftime("%Y-%m-%d") if interval in ("1d","1wk","1mo") \
                    else ts.strftime("%Y-%m-%dT%H:%M:%S")
                bars.append({
                    "time":   t,
                    "open":   round(float(row["Open"]),   4),
                    "high":   round(float(row["High"]),   4),
                    "low":    round(float(row["Low"]),    4),
                    "close":  round(float(row["Close"]),  4),
                    "volume": round(float(row["Volume"]), 0),
                })
            except Exception:
                continue
        return bars
    except Exception as e:
        print(f"[TV Brain] OHLCV fetch error for {ticker}: {e}")
        return []


# ── Technical indicator helpers ───────────────────────────────────────────────
def _compute_technicals(ticker: str) -> dict:
    try:
        df = yf.download(ticker, period="6mo", interval="1d",
                         progress=False, auto_adjust=True)
        if df.empty or len(df) < 30:
            return {}

        if hasattr(df.columns, 'levels'):
            df.columns = df.columns.get_level_values(0)

        close = df["Close"].squeeze()
        volume = df["Volume"].squeeze()
        high   = df["High"].squeeze()
        low    = df["Low"].squeeze()

        # RSI-14
        delta = close.diff()
        gain  = delta.clip(lower=0).rolling(14).mean()
        loss  = (-delta.clip(upper=0)).rolling(14).mean()
        rs    = gain / loss.replace(0, np.nan)
        rsi   = float((100 - 100 / (1 + rs)).iloc[-1])

        # EMAs
        ema_20  = float(close.ewm(span=20).mean().iloc[-1])
        ema_50  = float(close.ewm(span=50).mean().iloc[-1])
        ema_200 = float(close.ewm(span=200).mean().iloc[-1])
        price   = float(close.iloc[-1])

        # MACD
        macd_line   = close.ewm(span=12).mean() - close.ewm(span=26).mean()
        signal_line = macd_line.ewm(span=9).mean()
        macd_val    = float(macd_line.iloc[-1])
        macd_sig    = float(signal_line.iloc[-1])
        macd_hist   = macd_val - macd_sig

        # ATR-14
        tr = np.maximum(
            high - low,
            np.maximum(abs(high - close.shift(1)), abs(low - close.shift(1)))
        )
        atr = float(tr.rolling(14).mean().iloc[-1])

        # Volume
        vol_ma  = float(volume.rolling(20).mean().iloc[-1])
        vol_cur = float(volume.iloc[-1])
        vol_spike = vol_cur > vol_ma * 1.5

        # Trend
        if price > ema_50 > ema_200:
            trend = "strong_uptrend"
        elif price > ema_50:
            trend = "uptrend"
        elif price < ema_50 < ema_200:
            trend = "strong_downtrend"
        else:
            trend = "downtrend"

        # 52W
        w52_high = float(close.rolling(252).max().iloc[-1])
        w52_low  = float(close.rolling(252).min().iloc[-1])

        return {
            "price":      round(price, 4),
            "rsi":        round(rsi, 2),
            "ema_20":     round(ema_20, 4),
            "ema_50":     round(ema_50, 4),
            "ema_200":    round(ema_200, 4),
            "macd":       round(macd_val, 4),
            "macd_signal": round(macd_sig, 4),
            "macd_hist":  round(macd_hist, 4),
            "atr":        round(atr, 4),
            "trend":      trend,
            "vol_spike":  vol_spike,
            "vol_ratio":  round(vol_cur / vol_ma if vol_ma > 0 else 1, 2),
            "w52_high":   round(w52_high, 4),
            "w52_low":    round(w52_low, 4),
        }
    except Exception as e:
        print(f"[TV Brain] Technicals error for {ticker}: {e}")
        return {}


def _get_fundamentals(ticker: str) -> dict:
    try:
        info = yf.Ticker(ticker).info
        return {
            "name":       info.get("longName", ticker),
            "sector":     info.get("sector", "N/A"),
            "industry":   info.get("industry", "N/A"),
            "market_cap": info.get("marketCap", 0),
            "pe_ratio":   info.get("trailingPE", None),
            "fwd_pe":     info.get("forwardPE", None),
            "revenue_growth": info.get("revenueGrowth", None),
            "profit_margin":  info.get("profitMargins", None),
            "summary":    str(info.get("longBusinessSummary", ""))[:500],
        }
    except Exception as e:
        return {"name": ticker, "sector": "N/A", "error": str(e)}


def _score_to_action(score: float) -> str:
    if score >= 80:   return "STRONG_BUY"
    if score >= 65:   return "BUY"
    if score >= 50:   return "WATCH"
    if score >= 35:   return "IGNORE"
    if score >= 20:   return "SELL"
    return "STRONG_SELL"


def _calculate_trade_setup(tech: dict, action: str) -> dict:
    price = tech.get("price", 0)
    atr   = tech.get("atr", price * 0.02)
    if price == 0 or atr == 0:
        return {"entry": 0, "stop": 0, "target": 0, "rr": 0}

    is_long = action in ("STRONG_BUY", "BUY", "WATCH")
    if is_long:
        entry  = round(price, 4)
        stop   = round(price - 1.5 * atr, 4)
        target = round(price + 3.0 * atr, 4)
    else:
        entry  = round(price, 4)
        stop   = round(price + 1.5 * atr, 4)
        target = round(price - 3.0 * atr, 4)

    risk   = abs(entry - stop)
    reward = abs(target - entry)
    rr     = round(reward / risk, 2) if risk > 0 else 0

    return {"entry": entry, "stop": stop, "target": target, "rr": rr}


# ── WebSocket streaming handler ───────────────────────────────────────────────
async def stream_tv_brain(websocket: WebSocket, ticker: str):
    """
    Multi-phase streaming AI brain analysis over WebSocket.
    Sends JSON frames so the frontend can render structured output.
    """
    ticker = ticker.upper()
    await websocket.accept()

    async def send(msg: dict):
        try:
            await websocket.send_text(json.dumps(msg))
            await asyncio.sleep(0.01)
        except Exception:
            pass

    try:
        # ── Phase 1: Technical indicators ────────────────────────────────────
        await send({"type": "phase", "id": "technical",
                    "label": "📊 Reading technical indicators…"})

        loop = asyncio.get_event_loop()
        tech = await loop.run_in_executor(None, _compute_technicals, ticker)

        if not tech:
            await send({"type": "error",
                        "msg": f"Could not fetch price data for {ticker}. Check the symbol."})
            await websocket.close()
            return

        trend_label = tech["trend"].replace("_", " ").title()
        tech_summary = (
            f"**{ticker}** @ ${tech['price']:,.2f}\n\n"
            f"- Trend: {trend_label}\n"
            f"- RSI-14: {tech['rsi']:.1f}"
            + (" ← overbought ⚠" if tech['rsi'] > 70 else
               " ← oversold ⚡" if tech['rsi'] < 30 else "") + "\n"
            f"- MACD: {tech['macd']:.4f} | Signal: {tech['macd_signal']:.4f} | "
            f"Hist: {'▲' if tech['macd_hist'] > 0 else '▼'}{abs(tech['macd_hist']):.4f}\n"
            f"- EMA 20/50/200: ${tech['ema_20']:,.2f} / ${tech['ema_50']:,.2f} / ${tech['ema_200']:,.2f}\n"
            f"- ATR-14: ${tech['atr']:,.2f} | Vol Ratio: {tech['vol_ratio']:.1f}x"
            + (" 🔥 spike" if tech['vol_spike'] else "") + "\n"
            f"- 52W Range: ${tech['w52_low']:,.2f} – ${tech['w52_high']:,.2f}"
        )
        await send({"type": "technical", "content": tech_summary, "data": tech})

        # ── Phase 2: Fundamentals ─────────────────────────────────────────────
        await send({"type": "phase", "id": "fundamentals",
                    "label": "🏢 Fetching fundamentals…"})

        fund = await loop.run_in_executor(None, _get_fundamentals, ticker)
        mcap = fund.get("market_cap", 0)
        mcap_str = (f"${mcap/1e12:.2f}T" if mcap > 1e12 else
                    f"${mcap/1e9:.1f}B"  if mcap > 1e9  else
                    f"${mcap/1e6:.0f}M"  if mcap > 1e6  else "N/A")

        pe = fund.get("pe_ratio")
        fpe = fund.get("fwd_pe")
        fund_summary = (
            f"**{fund['name']}** — {fund['sector']} / {fund['industry']}\n\n"
            f"- Market Cap: {mcap_str}\n"
            f"- Trailing PE: {f'{pe:.1f}x' if pe else 'N/A'} | "
            f"Forward PE: {f'{fpe:.1f}x' if fpe else 'N/A'}\n"
            + (f"- Rev Growth: {fund['revenue_growth']*100:.1f}%\n"
               if fund.get("revenue_growth") else "")
            + (f"- Profit Margin: {fund['profit_margin']*100:.1f}%\n"
               if fund.get("profit_margin") else "")
        )
        await send({"type": "fundamentals", "content": fund_summary, "data": fund})

        # ── Phase 3: Quant prediction ─────────────────────────────────────────
        await send({"type": "phase", "id": "quant",
                    "label": "🧠 Running Quant Transformer…"})

        try:
            from rag_brain import quant_predict
            qpred = await quant_predict(ticker)
            quant_summary = (
                f"Quant Model ({qpred.model}): **{qpred.trend}** with "
                f"{qpred.confidence:.1f}% confidence | Volatility: {qpred.volatility}"
            )
            quant_score = qpred.confidence if qpred.trend == "BULLISH" \
                else 100 - qpred.confidence
        except Exception as e:
            quant_summary = f"Quant model unavailable: {e}"
            quant_score   = 50.0

        await send({"type": "quant", "content": quant_summary})

        # ── Phase 4: Claude synthesis ─────────────────────────────────────────
        await send({"type": "phase", "id": "claude",
                    "label": "✨ Claude synthesising final verdict…"})

        # Compute a raw score for action
        rsi_score = 70 - abs(tech["rsi"] - 55)          # sweet-spot 40-65
        trend_score = {
            "strong_uptrend": 85, "uptrend": 70,
            "downtrend": 35, "strong_downtrend": 20,
        }.get(tech["trend"], 50)
        macd_score = 65 if tech["macd_hist"] > 0 else 40
        raw_score  = trend_score * 0.40 + rsi_score * 0.20 + \
                     macd_score * 0.15 + quant_score * 0.25
        raw_score  = max(0, min(100, raw_score))
        action     = _score_to_action(raw_score)
        setup      = _calculate_trade_setup(tech, action)

        client = _get_client()
        verdict_prompt = f"""You are a quantitative trading analyst. Synthesise a trading verdict for {ticker}.

Technical data:
{json.dumps(tech, indent=2)}

Fundamentals:
{json.dumps({k:v for k,v in fund.items() if k != 'summary'}, indent=2)}

Quant prediction: {quant_summary}

Composite score: {raw_score:.1f}/100 → {action}

Trade setup:
- Entry: ${setup['entry']:,.2f}
- Stop loss: ${setup['stop']:,.2f}
- Target: ${setup['target']:,.2f}
- Risk/Reward: {setup['rr']}:1

Write a concise 3-5 sentence synthesis covering:
1. The overall bias and why (technical + quant alignment)
2. Key risk to the trade
3. What would invalidate this setup

Be direct and specific. Use exact price levels from the data."""

        synthesis_text = ""
        with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=400,
            system="You are an elite quant analyst. Be concise, specific, and data-driven. No disclaimers.",
            messages=[{"role": "user", "content": verdict_prompt}],
        ) as stream:
            for chunk in stream.text_stream:
                synthesis_text += chunk
                await send({"type": "stream_chunk", "content": chunk})
                await asyncio.sleep(0.005)

        # ── Phase 5: Final signal ─────────────────────────────────────────────
        signal = TVSignal(
            ticker=ticker,
            action=action,
            confidence=round(raw_score, 1),
            entry=setup["entry"],
            stop=setup["stop"],
            target=setup["target"],
            rr_ratio=setup["rr"],
            timeframe="1D",
            reasoning=synthesis_text[:300],
        )
        await send({"type": "signal", "data": signal.model_dump()})
        await send({"type": "done"})
        await websocket.close()

    except WebSocketDisconnect:
        pass
    except RuntimeError as e:
        await send({"type": "error", "msg": str(e)})
        try:
            await websocket.close()
        except Exception:
            pass
    except Exception as e:
        await send({"type": "error", "msg": f"Brain error: {e}"})
        try:
            await websocket.close()
        except Exception:
            pass
