---
name: performance_analyzer
type: agent
version: 1.0.0
---

# Performance Analysis Agent

## Purpose
Autonomous agent for backtest analysis, performance tracking, and strategy optimization.

## Capabilities

### 1. Backtest Execution
- Historical signal replay
- Commission and slippage modeling
- Multi-asset portfolio simulation
- Walk-forward analysis

### 2. Performance Metrics
- Win rate and profit factor
- Sharpe ratio and risk metrics
- Drawdown analysis
- Period-by-period returns

### 3. Signal Analysis
- Signal accuracy tracking
- False positive detection
- Win/loss analysis by symbol
- Timeframe performance comparison

### 4. Optimization
- Parameter sensitivity analysis
- Weight optimization
- Strategy regime analysis
- Robustness testing

## Workflow

```
Load Historical Data
    ↓
Generate Signals (Historical)
    ↓
Simulate Trading
    ↓
Calculate Metrics
    ↓
Analyze Results
    ↓
Generate Reports
```

## Performance Metrics

### Risk Metrics
- Maximum Drawdown
- Drawdown Duration
- Sharpe Ratio
- Sortino Ratio
- Calmar Ratio

### Return Metrics
- Total Return
- Annualized Return
- Monthly Returns
- Best Month
- Worst Month

### Trade Metrics
- Total Trades
- Win Rate
- Profit Factor
- Average Win / Loss
- Winning/Losing Streaks

## Analysis Reports

1. **Daily Performance Report**
   - Today's signals
   - Win rate
   - P&L
   - Risk metrics

2. **Weekly Analysis**
   - Win rate trends
   - Drawdown analysis
   - Signal accuracy
   - Symbol performance

3. **Monthly Backtest**
   - Historical performance
   - Parameter analysis
   - Regime comparison
   - Optimization results

## Integration Points

- Market Data APIs (yfinance)
- Signal Database
- Portfolio Data
- Backtesting Engine
- Report Generation
- Notification System

## Update Schedule

- Daily: Performance calculation (after market close)
- Weekly: Trend analysis (Sunday evening)
- Monthly: Full backtest (first day of month)
- On-Demand: Custom analysis requests
