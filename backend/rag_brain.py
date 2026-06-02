# rag_brain.py — AI Finance Brain: RAG Research + Quant prediction endpoints
# Extends the existing AI Trading Platform with streaming research and Quant Brain.
# Uses Anthropic Claude API (already in requirements) — no Ollama needed for Railway.

import asyncio
import os
import numpy as np
import torch
import yfinance as yf
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from anthropic import Anthropic

# ── Anthropic client (reuses existing env var) ──────────────────────────────
def _get_client() -> Anthropic:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    return Anthropic(api_key=key)

# ── Quant Brain: lightweight Transformer ────────────────────────────────────
class QuantTransformer(torch.nn.Module):
    def __init__(self, input_dim=8, d_model=64, nhead=4, num_layers=2):
        super().__init__()
        self.input_proj = torch.nn.Linear(input_dim, d_model)
        self.pos_encoder = torch.nn.Parameter(torch.zeros(1, 1000, d_model))
        enc = torch.nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead,
                                               batch_first=True, dropout=0.1)
        self.transformer = torch.nn.TransformerEncoder(enc, num_layers=num_layers)
        self.trend_head  = torch.nn.Linear(d_model, 2)
        self.vol_head    = torch.nn.Linear(d_model, 1)

    def forward(self, x):
        x = self.input_proj(x)
        x = x + self.pos_encoder[:, :x.size(1), :]
        x = self.transformer(x)
        x = x[:, -1, :]
        return self.trend_head(x), self.vol_head(x)

_quant_model: QuantTransformer | None = None

def get_quant_model() -> QuantTransformer:
    global _quant_model
    if _quant_model is None:
        m = QuantTransformer()
        weights = "quant_brain_weights.pth"
        try:
            m.load_state_dict(torch.load(weights, map_location="cpu", weights_only=True))
            print(f"✓ Loaded Quant model weights from {weights}")
        except FileNotFoundError:
            print("⚠ No quant weights found — using untrained model (run train_quant.py to fix)")
        m.eval()
        _quant_model = m
    return _quant_model

# ── Feature engineering ─────────────────────────────────────────────────────
def _build_features(ticker: str):
    df = yf.download(ticker, period="6mo", interval="1d", progress=False)
    if df.empty or len(df) < 60:
        raise HTTPException(status_code=400,
            detail=f"Insufficient price history for {ticker}")
    df["SMA_20"]       = df["Close"].rolling(20).mean()
    df["Volatility"]   = df["Close"].rolling(20).std()
    df["Daily_Return"] = df["Close"].pct_change()
    df.dropna(inplace=True)

    cols = ["Open","High","Low","Close","Volume","SMA_20","Volatility","Daily_Return"]
    raw  = df[cols].values[-60:].astype(float)

    # MinMax scale on-the-fly (scaler.pkl optional — use if available)
    try:
        import joblib
        scaler = joblib.load("scaler.pkl")
        features = scaler.transform(raw)
    except Exception:
        lo, hi = raw.min(axis=0), raw.max(axis=0)
        rng = np.where(hi - lo == 0, 1, hi - lo)
        features = (raw - lo) / rng

    recent_vol = float(df["Volatility"].iloc[-1])
    return features, recent_vol

# ── Pydantic models ──────────────────────────────────────────────────────────
class QuantPrediction(BaseModel):
    ticker:     str
    trend:      str
    volatility: str
    confidence: float

# ── Quant prediction ─────────────────────────────────────────────────────────
async def quant_predict(ticker: str) -> QuantPrediction:
    features, recent_vol = _build_features(ticker)
    model = get_quant_model()

    x = torch.tensor(features, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        logits, _ = model(x)
        probs      = torch.softmax(logits, dim=1).numpy()[0]
        pred       = int(np.argmax(probs))
        confidence = float(probs[pred]) * 100

    trend     = "BULLISH" if pred == 1 else "BEARISH"
    vol_label = ("HIGH"   if recent_vol > 0.03  else
                 "MEDIUM" if recent_vol > 0.015 else "LOW")

    return QuantPrediction(
        ticker=ticker.upper(), trend=trend,
        volatility=vol_label, confidence=round(confidence, 2)
    )

# ── RAG context (Claude-based, no Ollama) ───────────────────────────────────
def _get_context(ticker: str) -> str:
    """Fallback to yfinance fundamentals — Qdrant optional."""
    try:
        info = yf.Ticker(ticker).info
        return (
            f"Company: {info.get('longName','N/A')}\n"
            f"Sector:  {info.get('sector','N/A')}\n"
            f"Market Cap: {info.get('marketCap','N/A')}\n"
            f"PE Ratio: {info.get('trailingPE','N/A')}\n"
            f"52W High: {info.get('fiftyTwoWeekHigh','N/A')} | "
            f"52W Low:  {info.get('fiftyTwoWeekLow','N/A')}\n"
            f"Summary: {str(info.get('longBusinessSummary','No data.'))[:600]}"
        )
    except Exception as e:
        return f"Could not fetch fundamentals for {ticker}: {e}"

RESEARCH_SYSTEM = (
    "You are an elite financial analyst providing structured research reports. "
    "Base your analysis ONLY on the context provided. Always include a risk disclaimer. "
    "Be concise, factual, and cite data points from the context."
)

RESEARCH_PROMPT = """Provide a structured research report on {ticker}.

Use exactly this format:
## 📊 Market Sentiment
[2-3 sentences on current sentiment and news]

## ⚠️ Key Risks
- [Risk 1]
- [Risk 2]
- [Risk 3]

## 📈 Technical Outlook
[2-3 sentences on technical picture]

## 💡 Summary
[1-2 sentences executive summary]

---
⚠️ Disclaimer: AI-generated analysis — not financial advice.

Context:
{context}"""

# ── Streaming WebSocket handler ──────────────────────────────────────────────
async def stream_research(websocket: WebSocket, ticker: str):
    await websocket.accept()
    try:
        await websocket.send_text(f"🔍 Fetching market context for {ticker.upper()}…\n\n")
        context = _get_context(ticker)

        await websocket.send_text(
            f"🧠 Generating AI Research for **{ticker.upper()}**…\n\n---\n\n"
        )

        client = _get_client()
        prompt = RESEARCH_PROMPT.format(ticker=ticker.upper(), context=context)

        with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=RESEARCH_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                await websocket.send_text(text)
                await asyncio.sleep(0.01)

        await websocket.close()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(f"\n\n❌ Error: {e}")
            await websocket.close()
        except Exception:
            pass
