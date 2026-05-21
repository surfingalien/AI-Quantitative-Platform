---
name: trading_executor
type: agent
version: 1.0.0
---

# Trading Execution Agent

## Purpose
Autonomous agent for executing trading signals with risk management, position sizing, and portfolio monitoring.

## Capabilities

### 1. Signal Execution
- Validate incoming signals
- Check pre-trade conditions
- Execute trades with proper sizing
- Track execution metrics

### 2. Risk Management
- Enforce position limits
- Apply stop losses
- Manage drawdowns
- Scale positions by volatility

### 3. Portfolio Monitoring
- Track portfolio exposure
- Monitor correlations
- Rebalance on drift
- Generate daily reports

## Workflow

```
Receive Signal
    ↓
Validate Signal
    ↓
Check Risk Limits
    ↓
Calculate Position Size
    ↓
Set Stop Loss & Take Profit
    ↓
Execute Trade
    ↓
Update Portfolio
    ↓
Monitor Position
```

## Key Metrics Tracked

- Execution latency
- Slippage analysis
- Win rate per symbol
- Drawdown by strategy
- Sharpe ratio trend

## Configuration

```python
EXECUTOR_CONFIG = {
    'max_position_size': 0.05,        # 5% max per trade
    'risk_per_trade': 0.01,           # 1% risk per trade
    'max_correlation': 0.7,           # Max correlation between holdings
    'rebalance_threshold': 0.05,      # 5% drift triggers rebalance
    'check_interval': 60,              # Check every 60 seconds
}
```

## Integration Points

- Signal Validation Skill
- Portfolio Optimization Skill
- Market Data (yfinance, Finnhub)
- Database (Signal, Portfolio, Trade logs)
- Notification System (alerts, reports)
