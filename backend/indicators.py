import yfinance as yf
import pandas as pd
import ta
import numpy as np

def fetch_and_calculate_technicals(symbol: str, timeframe: str = "15m", period: str = "5d") -> dict:
    """
    Fetches real market data from Yahoo Finance and calculates technical indicators.
    """
    try:
        # yfinance interval mapping: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
        interval = timeframe if timeframe in ["1m", "5m", "15m", "30m", "1h", "1d", "1wk"] else "15m"
        
        # Download historical data
        df = yf.download(symbol, period=period, interval=interval, progress=False)
        
        if df.empty or len(df) < 30:
            return _mock_technicals(symbol)
            
        # Ensure flat columns if yfinance returns MultiIndex
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        close = df['Close']
        high = df['High']
        low = df['Low']
        volume = df['Volume']

        # Calculate Indicators using 'ta' library
        # 1. RSI
        rsi_14 = ta.momentum.RSIIndicator(close, window=14).rsi().iloc[-1]
        
        # 2. MACD
        macd = ta.trend.MACD(close)
        macd_val = macd.macd().iloc[-1]
        macd_signal = macd.macd_signal().iloc[-1]
        macd_hist = macd.macd_diff().iloc[-1]
        
        macd_state = "bullish" if macd_val > macd_signal else "bearish"
        if macd_val > 0 and macd_state == "bullish":
            macd_state = "strong_bullish"
            
        # 3. ATR (Volatility)
        atr = ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range().iloc[-1]
        
        # 4. Trend (EMA alignment)
        ema_20 = ta.trend.EMAIndicator(close, window=20).ema_indicator().iloc[-1]
        ema_50 = ta.trend.EMAIndicator(close, window=50).ema_indicator().iloc[-1]
        
        current_price = close.iloc[-1]
        if current_price > ema_20 > ema_50:
            trend = "strong_uptrend"
        elif current_price < ema_20 < ema_50:
            trend = "strong_downtrend"
        elif current_price > ema_50:
            trend = "uptrend"
        else:
            trend = "downtrend"
            
        # 5. Volume Spike
        avg_volume = volume.rolling(window=20).mean().iloc[-1]
        current_vol = volume.iloc[-1]
        volume_spike = current_vol > (avg_volume * 1.5)

        return {
            "current_price": float(current_price),
            "rsi_14": float(rsi_14) if not np.isnan(rsi_14) else 50.0,
            "macd": {
                "value": float(macd_val) if not np.isnan(macd_val) else 0.0,
                "signal": float(macd_signal) if not np.isnan(macd_signal) else 0.0,
                "histogram": float(macd_hist) if not np.isnan(macd_hist) else 0.0,
                "state": macd_state
            },
            "atr": float(atr) if not np.isnan(atr) else 0.0,
            "trend": trend,
            "volume_spike": bool(volume_spike),
            "ema_20": float(ema_20) if not np.isnan(ema_20) else 0.0,
            "ema_50": float(ema_50) if not np.isnan(ema_50) else 0.0
        }
        
    except Exception as e:
        print(f"Error calculating technicals for {symbol}: {e}")
        return _mock_technicals(symbol)

def _mock_technicals(symbol: str) -> dict:
    """Fallback if data fetching fails"""
    return {
        "rsi_14": 50.0,
        "macd": {"state": "neutral"},
        "atr": 0.0,
        "trend": "ranging",
        "volume_spike": False,
        "error": "Failed to fetch real data, using mock."
    }

if __name__ == "__main__":
    # Test it
    print(fetch_and_calculate_technicals("AAPL"))
