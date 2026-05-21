# AI-Quantitative Platform: Specialized Agents

This directory contains specialized autonomous agents that enhance the platform with advanced trading capabilities, market analysis, and performance optimization.

## Agents

### 📊 Trading Executor Agent
**File:** `skills/trading-executor.md`

Autonomous trading execution with:
- Signal validation and execution
- Risk management and position sizing
- Portfolio monitoring
- Trade tracking and metrics

**Triggers:** Incoming trading signals  
**Update Frequency:** Real-time (as signals arrive)  
**Dependencies:** Signal Validation Skill, Portfolio Optimization Skill

---

### 🔍 Market Analyzer Agent
**File:** `skills/market-analyzer.md`

Continuous market analysis with:
- Real-time price monitoring across timeframes
- Technical indicator calculation
- Pattern and breakout detection
- Opportunity ranking and alerts

**Scope:** S&P 500 stocks, 4 timeframes  
**Update Frequency:** Every 5 minutes  
**Dependencies:** Technical Indicators Skill, Market Data APIs

---

### 📈 Performance Analyzer Agent
**File:** `skills/performance-analyzer.md`

Comprehensive performance tracking with:
- Backtesting and historical simulation
- Performance metrics calculation
- Signal accuracy analysis
- Strategy optimization

**Reports:** Daily, Weekly, Monthly  
**Update Frequency:** Automated schedule  
**Dependencies:** Backtest Framework, Database

---

## Agent Architecture

```
Trading Executor Agent
├─ Receive Signal
├─ Validate (Signal Validation Skill)
├─ Position Size (Portfolio Optimization Skill)
├─ Execute Trade
└─ Monitor (Performance Analyzer Agent)

Market Analyzer Agent
├─ Monitor Prices
├─ Calculate Indicators
├─ Generate Signals
└─ Report Opportunities

Performance Analyzer Agent
├─ Historical Analysis
├─ Calculate Metrics
├─ Optimize Strategy
└─ Generate Reports
```

## Skill Dependencies

| Agent | Required Skills | APIs | Database |
|-------|-----------------|------|----------|
| Trading Executor | Signal Validation, Portfolio Optimization | - | Signals, Portfolio, Trades |
| Market Analyzer | Backtest Strategy, Signal Validation | yfinance, Finnhub | Signals, Opportunities |
| Performance Analyzer | Backtest Strategy, Testing Framework | yfinance | Signals, Trades, Portfolio |

## Configuration

### Trading Executor
```python
{
    'max_position_size': 0.05,        # 5% max
    'risk_per_trade': 0.01,           # 1% risk
    'max_correlation': 0.7,           # Max corr
    'rebalance_threshold': 0.05       # 5% drift
}
```

### Market Analyzer
```python
{
    'symbols': ['SPY', 'QQQ', 'IWM', ...],  # Top 500
    'timeframes': ['15m', '1h', '4h', '1d'],
    'update_interval': 300,                  # 5 minutes
    'lookback_period': 2 * 252                # 2 years
}
```

### Performance Analyzer
```python
{
    'daily_report_time': '16:30',     # After market
    'weekly_report_day': 0,            # Monday
    'monthly_backtest_day': 1,         # 1st of month
    'backtest_periods': [1, 3, 6, 12]  # months
}
```

## Integration Points

### With Webhook System
```
TradingView Webhook
    ↓
Signal Generation
    ↓
Trading Executor Agent (validates & executes)
    ↓
Portfolio Updates
    ↓
Performance Analyzer Agent (tracks performance)
```

### With Monitoring
```
Market Analyzer Agent (generates signals)
    ↓
Signal Validation Skill
    ↓
Trading Executor Agent
    ↓
Notification System (alerts)
    ↓
WebSocket Broadcasting (real-time updates)
```

## Metrics & KPIs

### Trading Executor
- Execution latency: < 2 seconds
- Success rate: > 98%
- Slippage: < 0.1%
- Positions managed: 10-50 active

### Market Analyzer
- Signals generated: 50-200 per day
- Signal accuracy: 55-65%
- Alerts sent: Based on configuration
- Analysis coverage: 500 symbols

### Performance Analyzer
- Daily backtest time: < 5 minutes
- Monthly analysis time: < 30 minutes
- Reports generated: 3+ per month
- Metrics tracked: 20+ per signal

## Deployment

### Local Development
```bash
# Start all agents locally
docker-compose up

# Monitor agent logs
docker-compose logs -f trading-executor
```

### Production
```bash
# Deploy with monitoring
docker-compose -f docker-compose.prod.yml up -d

# Enable alerting
export ALERT_WEBHOOK=https://alerts.example.com/webhook
```

## Best Practices

1. **Validation First** - Always validate signals before execution
2. **Risk Management** - Enforce position limits strictly
3. **Monitoring** - Track all agent actions
4. **Logging** - Log all decisions for audit trail
5. **Testing** - Backtest before deploying
6. **Alerting** - Get notified of anomalies
7. **Documentation** - Update runbooks regularly

## Troubleshooting

### "Signals not being executed"
- Check Trading Executor agent logs
- Verify signal validation passing
- Check API key permissions
- Review risk limits

### "No opportunities detected"
- Verify Market Analyzer is running
- Check market data API connectivity
- Review signal generation configuration
- Check symbol list

### "Performance reports missing"
- Check Performance Analyzer schedule
- Verify database connectivity
- Check backtest engine logs
- Review report generation code

## Next Steps

1. Deploy agents to production
2. Set up monitoring and alerting
3. Configure notification system
4. Start live backtesting
5. Monitor performance metrics
6. Optimize strategies based on results
7. Scale to more symbols/timeframes

## References

- [Skill Directory](../skills/README.md)
- [Architecture Guide](../../docs/architecture.md)
- [API Documentation](../../docs/api.md)
- [Deployment Guide](../../docs/deployment.md)
