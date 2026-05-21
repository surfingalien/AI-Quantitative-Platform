---
name: backtest_strategy
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - /backtest
---

# Strategy Backtesting & Analysis

## Overview

This skill provides expert guidance on backtesting trading strategies, analyzing historical performance, validating signals, and optimizing trading algorithms for the AI-Quantitative Platform.

## Key Concepts

### Backtesting Framework
- Historical data validation
- Commission and slippage modeling
- Drawdown analysis
- Sharpe ratio and risk metrics
- Walk-forward optimization

### Performance Metrics
- **Win Rate:** Percentage of profitable trades
- **Profit Factor:** Gross profit / Gross loss
- **Sharpe Ratio:** Risk-adjusted return
- **Max Drawdown:** Largest peak-to-trough decline
- **Recovery Factor:** Total profit / Max Drawdown

## Backtesting Best Practices

### 1. Data Quality
```python
# Validate OHLCV data
- Check for missing values
- Verify price continuity
- Confirm volume patterns
- Detect splits/dividends
```

### 2. Signal Validation
```python
# Before backtesting signals
- Verify indicator calculations
- Check signal timing accuracy
- Validate no look-ahead bias
- Confirm signal generation logic
```

### 3. Performance Analysis
```python
# Required metrics for trading signals
metrics = {
    'win_rate': float,           # % of profitable trades
    'profit_factor': float,       # Gross profit / loss
    'sharpe_ratio': float,        # Risk-adjusted return
    'max_drawdown': float,        # Peak-to-trough decline
    'total_return': float,        # Total cumulative return
    'trades_count': int,          # Number of trades
    'avg_win': float,             # Average winning trade
    'avg_loss': float,            # Average losing trade
}
```

### 4. Risk Assessment
```python
# Position sizing calculation
def calculate_position_size(account_size, risk_percent, stop_loss_points):
    risk_amount = account_size * risk_percent
    position_size = risk_amount / stop_loss_points
    return position_size
```

## Hybrid Score Analysis

The platform uses a hybrid scoring system combining:
- Technical indicators (RSI, MACD, Volume) = 40%
- AI confidence score = 30%
- Market trend = 30%

### Score Thresholds
```
Score >= 80: STRONG BUY - High conviction, favorable conditions
Score 60-79: BUY - Moderate conviction, setup looks good
Score 40-59: WATCH - Neutral, monitor for entry
Score < 40: IGNORE - Weak signal, risk/reward unfavorable
```

## Backtesting Workflow

```
1. Prepare Historical Data
   ├─ Download OHLCV data
   ├─ Validate quality
   └─ Handle adjustments (splits, dividends)

2. Generate Trading Signals
   ├─ Calculate technical indicators
   ├─ Apply AI analysis
   └─ Generate hybrid scores

3. Simulate Trading
   ├─ Execute on signals
   ├─ Apply commissions
   └─ Track positions

4. Analyze Results
   ├─ Calculate metrics
   ├─ Identify patterns
   └─ Optimize parameters

5. Validate Results
   ├─ Out-of-sample testing
   ├─ Walk-forward analysis
   └─ Reality check
```

## Common Pitfalls

### 1. Look-Ahead Bias
❌ Wrong:
```python
# Uses future data to generate today's signal
signal = analyze_with_future_data(today, tomorrow)
```

✅ Right:
```python
# Uses only historical data available at signal time
signal = analyze_with_historical_data(today)
```

### 2. Overfitting
❌ Wrong:
```python
# Optimizing on entire dataset
optimize_parameters(full_historical_data)
```

✅ Right:
```python
# Train on 80%, validate on 20%
optimize_parameters(training_data)
validate_on(test_data)
```

### 3. Ignoring Transaction Costs
❌ Wrong:
```python
# Backtest without commissions
profit = entry_price - exit_price
```

✅ Right:
```python
# Include realistic costs
commission = entry_price * 0.001  # 0.1%
slippage = entry_price * 0.0005   # 0.05%
actual_profit = entry_price - exit_price - commission - slippage
```

## Implementation Guide

### Step 1: Prepare Data
```python
import yfinance as yf
import pandas as pd

# Download historical data
data = yf.download("AAPL", start="2023-01-01", end="2024-01-01")

# Validate data
assert not data.isnull().any().any(), "Missing data detected"
assert (data.index == data.index.sort_values()).all(), "Unsorted data"
```

### Step 2: Generate Signals
```python
from indicators import fetch_and_calculate_technicals

# Calculate technical indicators
for date in data.index:
    technicals = fetch_and_calculate_technicals("AAPL", "1d")
    signal = generate_signal(technicals)
    signals.append(signal)
```

### Step 3: Backtest
```python
# Simulate trading
portfolio = Portfolio(initial_capital=10000)
for date, signal in signals.items():
    if signal['decision'] == 'BUY':
        portfolio.buy(signal['symbol'], signal['price'])
    elif signal['decision'] == 'SELL':
        portfolio.sell(signal['symbol'], signal['price'])

# Calculate metrics
metrics = portfolio.calculate_metrics()
```

### Step 4: Analyze Results
```python
# Print performance
print(f"Total Return: {metrics['total_return']:.2%}")
print(f"Win Rate: {metrics['win_rate']:.2%}")
print(f"Sharpe Ratio: {metrics['sharpe_ratio']:.2f}")
print(f"Max Drawdown: {metrics['max_drawdown']:.2%}")
```

## Testing Strategy Improvements

### When to Backtest
- After developing new signal
- Before deploying to live trading
- When market regime changes significantly
- Quarterly performance review

### When to NOT Backtest
- On incomplete data
- With look-ahead bias
- Without proper validation
- On extremely short periods (<3 months)

## Next Steps

1. **Implement backtesting framework**
   ```bash
   # Add backtesting module to backend
   python backend/backtest_engine.py
   ```

2. **Validate historical signals**
   ```bash
   # Check signal performance over last 6 months
   python backend/validate_signals.py
   ```

3. **Optimize parameters**
   ```bash
   # Walk-forward optimization
   python backend/optimize_parameters.py
   ```

4. **Generate reports**
   ```bash
   # Create performance analysis
   python backend/generate_backtest_report.py
   ```

## References

- [Backtest Best Practices](https://en.wikipedia.org/wiki/Backtesting)
- [Walk-Forward Analysis](https://en.wikipedia.org/wiki/Walk_forward_optimization)
- [Performance Metrics Guide](https://www.investopedia.com/terms/s/sharperatio.asp)

## Support

For backtesting questions:
- Review signal generation logic
- Validate technical indicator calculations
- Check portfolio transaction tracking
- Analyze performance metrics
