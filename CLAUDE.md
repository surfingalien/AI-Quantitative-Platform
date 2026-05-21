# AI-Quantitative Platform — Claude Instructions

**Profile:** Suhas GM (suhasgm@gmail.com)  
**Platform Version:** 1.0.0  
**Last Updated:** 2026-05-21  

---

## 🎯 Your Trading Profile

### User Context
- **Experience Level:** Advanced (quantitative trading background)
- **Trading Style:** Algorithmic & systematic
- **Primary Markets:** Crypto (Bitcoin, Ethereum) + US Equities (S&P 500)
- **Timeframes:** Multi-timeframe (15m, 1h, 4h, daily)
- **Focus Areas:** Signal generation, portfolio optimization, risk management

### Trading Objectives
1. **Automated Signal Generation** — AI-driven entry/exit signals
2. **Portfolio Risk Management** — Dynamic position sizing and exposure limits
3. **Performance Analytics** — Real-time tracking and optimization
4. **Strategy Backtesting** — Validate new strategies before live trading
5. **Multi-Asset Screening** — Identify opportunities across crypto and equities

---

## 🏗️ Platform Architecture

### 6 Integrated Skills
| Skill | Purpose | When to Use |
|-------|---------|-----------|
| **Backtest Strategy** | Historical validation, performance metrics | Testing new signals |
| **Signal Validation** | Data quality, confidence scoring | Processing webhook signals |
| **Portfolio Optimization** | Position sizing, exposure limits | Trade execution |
| **API Security** | Auth, rate limiting, encryption | API deployment |
| **Docker Deployment** | Containerization, orchestration | Production deployment |
| **Testing Framework** | Unit/integration tests, CI/CD | Code quality |

### 3 Autonomous Agents
| Agent | Responsibility | Triggers |
|-------|-----------------|----------|
| **Trading Executor** | Execute validated signals with risk management | Incoming TradingView webhooks |
| **Market Analyzer** | Real-time monitoring, pattern detection | Every 5 minutes (configurable) |
| **Performance Analyzer** | Backtest execution, metrics, optimization | Daily/weekly/monthly schedule |

---

## 🔄 Decision Tree — Which Skill/Agent When

### "I want to validate a trading signal"
→ Use **Signal Validation Skill**
1. Check data completeness (OHLCV, volume, indicator values)
2. Validate value ranges (no NaN, no extreme outliers)
3. Score signal confidence (hybrid: 40% technical + 30% AI + 30% trend)
4. Route to Trading Executor if confidence ≥ 6/10

**Key Tools:**
- `validate_signal()` — comprehensive quality check
- `calculate_hybrid_score()` — confidence scoring
- `check_data_freshness()` — ensure < 5 minutes old

---

### "I want to calculate position size for a trade"
→ Use **Portfolio Optimization Skill**
1. Get current portfolio exposure
2. Calculate max position size (5% single position max)
3. Apply volatility scaling (ATR-based)
4. Check sector limits (20% max per sector)
5. Enforce total leverage cap (130% max)

**Configuration:**
```python
PORTFOLIO_LIMITS = {
    'max_position_size': 0.05,          # 5% per trade
    'max_sector_exposure': 0.20,        # 20% per sector
    'max_total_leverage': 1.30,         # 130% total
    'risk_per_trade': 0.01,             # 1% account risk
}
```

---

### "I want to backtest a new strategy"
→ Use **Backtest Strategy Skill**
1. Load historical data (OHLCV + indicators)
2. Replay signals (apply to each historical bar)
3. Calculate metrics:
   - Win Rate (% winning trades)
   - Profit Factor (gross profit / gross loss)
   - Sharpe Ratio (risk-adjusted returns)
   - Max Drawdown (peak-to-trough decline)
4. Perform walk-forward validation
5. Generate performance report

**Report Template:**
```
Strategy: [Name]
Symbol: [Ticker] | Timeframe: [TF] | Period: [Dates]

Key Metrics:
- Win Rate: XX%
- Profit Factor: X.XX
- Sharpe Ratio: X.XX
- Max Drawdown: XX%
- Avg Trade P&L: $XXX

Strengths: [2-3 bullets]
Weaknesses: [2-3 bullets]
Improvements: [3-5 specific actions]
```

---

### "I want to set up live trading with risk limits"
→ Use **Trading Executor Agent** + **Portfolio Optimization Skill**

**Workflow:**
1. Webhook arrives (TradingView alert)
2. Validate signal (Signal Validation)
3. Check portfolio limits (Portfolio Optimization)
4. Size position (risk per trade = 1% account)
5. Execute trade (Market order with slippage allowance)
6. Track metrics (execution latency, slippage, P&L)
7. Monitor portfolio (exposure, correlations, drawdown)

**Configuration:**
```python
EXECUTOR_CONFIG = {
    'max_position_size': 0.05,
    'risk_per_trade': 0.01,
    'max_correlation': 0.7,
    'rebalance_threshold': 0.05,
    'check_interval': 60,  # seconds
}
```

---

### "I want real-time market analysis across multiple symbols"
→ Use **Market Analyzer Agent**

**Scope:**
- **Coverage:** Top 500 S&P stocks + major crypto (BTC, ETH, etc.)
- **Timeframes:** 15m, 1h, 4h, 1d
- **Update Frequency:** Every 5 minutes
- **Historical Lookback:** 2 years

**Outputs Generated:**
- Trading signals (BUY, SELL, WATCH)
- Confidence scores (0-100)
- Risk/reward ratios
- Market regime assessments (trending/choppy/breakout)

---

### "I want detailed performance analytics"
→ Use **Performance Analyzer Agent**

**Reports Generated:**
1. **Daily** — Today's signals, win rate, P&L summary
2. **Weekly** — Trend analysis, drawdown review, symbol performance
3. **Monthly** — Full backtest, parameter sensitivity, regime comparison

**Agent Responsibilities:**
- Execute backtests on historical data
- Calculate 20+ performance metrics
- Analyze signal accuracy and timing
- Identify improvement opportunities
- Generate actionable recommendations

---

## 🔌 API Endpoints — Your Trading Interface

### Signal Processing
```
POST /api/tv-webhook
Accepts TradingView webhook with signal data
├─ Validation (data quality, freshness)
├─ Signal scoring (confidence)
├─ Risk checks (position size, exposure)
└─ Execution (if approved)
```

### Data Retrieval
```
GET /api/signals          → Recent processed signals
GET /api/portfolio        → Current holdings & exposure
GET /api/performance      → P&L and metrics
GET /api/opportunities    → Market analysis results
```

### Streaming
```
WebSocket /ws            → Real-time signal updates
Redis pub/sub            → Agent internal communication
```

---

## 📊 Integration Map — Your Full Trading Stack

```
TradingView Desktop Alert (Webhook)
    ↓
    ├─→ Signal Validation Skill
    │   (Check data quality, calculate confidence)
    │   ↓
    ├─→ Portfolio Optimization Skill
    │   (Check limits, calculate position size)
    │   ↓
    └─→ Trading Executor Agent
        ├─ Execute trade
        ├─ Set stops/targets
        ├─ Update portfolio
        └─ Broadcast update (WebSocket)

Parallel Process (Every 5 min):
Market Analyzer Agent
    ├─ Monitor 500+ symbols
    ├─ Calculate technicals
    ├─ Generate signals
    ├─ Rank opportunities
    └─ Store in database

Daily/Weekly/Monthly:
Performance Analyzer Agent
    ├─ Run backtests
    ├─ Calculate metrics
    ├─ Analyze trends
    └─ Generate reports
```

---

## 🛠️ Configuration for Your Profile

### Market Coverage
```python
MARKETS = {
    'crypto': ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'LINK/USDT'],
    'us_stocks': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', ...],  # Top 500
    'indices': ['SPY', 'QQQ', 'IWM'],
}

TIMEFRAMES = ['15m', '1h', '4h', 'D']
```

### Risk Parameters
```python
RISK_MANAGEMENT = {
    'account_size': 100000,              # USD starting capital
    'risk_per_trade': 1000,              # $1000 risk per trade (1% of $100k)
    'max_position_size': 5000,           # 5% of account
    'max_sector_exposure': 20000,        # 20% max per sector
    'max_total_leverage': 130000,        # 130% total
    'max_drawdown_threshold': 20,        # 20% max drawdown before alert
    'rebalance_frequency': 'weekly',     # Rebalance weekly
}
```

### Signal Thresholds
```python
SIGNAL_THRESHOLDS = {
    'min_confidence': 6,        # 6/10 minimum to execute
    'min_hybrid_score': 60,     # 60/100 hybrid score threshold
    'max_data_age': 300,        # 5 minutes max data freshness
    'rsi_overbought': 70,       # RSI > 70 = overbought
    'rsi_oversold': 30,         # RSI < 30 = oversold
    'min_volume_ratio': 0.8,    # At least 80% of avg volume
}
```

### Backtesting Settings
```python
BACKTEST_CONFIG = {
    'commission': 0.001,        # 0.1% trading cost
    'slippage': 0.0005,         # 0.05% slippage allowance
    'lookback_period': 2,       # 2 years historical data
    'walk_forward_window': 252, # 1 year walk-forward validation
    'optimization_method': 'sharpe_ratio',  # Optimize for risk-adjusted returns
}
```

---

## 🧪 Testing Your Features

### 1. Signal Validation Test
```bash
# Test with mock webhook
python -m pytest backend/test_webhook.py::test_signal_validation

# Validates:
✓ Data completeness (OHLCV, volume present)
✓ Value ranges (no NaN, sane price levels)
✓ Confidence scoring (technical + AI + trend blend)
✓ Freshness check (< 5 min old)
```

### 2. Portfolio Optimization Test
```bash
# Test position sizing
python -m pytest backend/test_portfolio.py::test_position_sizing

# Validates:
✓ Max position size (5% enforced)
✓ Sector limits (20% max per sector)
✓ Total leverage cap (130% max)
✓ Volatility scaling (ATR-based adjustment)
```

### 3. Backtest Execution Test
```bash
# Test strategy backtesting
python -m pytest backend/test_backtest.py::test_backtest_execution

# Validates:
✓ Historical signal replay
✓ Performance metric calculation
✓ Win rate, profit factor, Sharpe ratio
✓ Drawdown analysis
✓ Walk-forward validation
```

### 4. Real-time Agent Tests
```bash
# Test Market Analyzer Agent
python -m pytest backend/test_agents.py::test_market_analyzer

# Validates:
✓ Multi-symbol scanning (500+ stocks)
✓ Multi-timeframe analysis (15m, 1h, 4h, 1d)
✓ Signal generation (BUY, SELL, WATCH)
✓ Confidence scoring
✓ Opportunity ranking

# Test Trading Executor Agent
python -m pytest backend/test_agents.py::test_trading_executor

# Validates:
✓ Webhook signal processing
✓ Risk limit enforcement
✓ Position size calculation
✓ Trade execution
✓ Portfolio update
```

### 5. Performance Analyzer Test
```bash
# Test performance analysis
python -m pytest backend/test_agents.py::test_performance_analyzer

# Validates:
✓ Metrics calculation (win rate, Sharpe, Profit Factor)
✓ Trade analysis (winners/losers, streaks)
✓ Equity curve assessment
✓ Report generation
```

---

## 📋 Your Command Reference

### Start the Platform
```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Process a Signal
```bash
# Send test webhook
curl -X POST http://localhost:8000/api/tv-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_SECRET",
    "symbol": "AAPL",
    "action": "buy",
    "price": 150.25,
    "volume": 1000000,
    "rsi": 65,
    "macd": "bullish"
  }'
```

### Get Portfolio Status
```bash
curl http://localhost:8000/api/portfolio
```

### Monitor Real-time Signals
```bash
# WebSocket connection
ws://localhost:8000/ws
```

---

## 🚀 Next Steps for Your Trading

### Phase 1: Setup & Validation (This Week)
- [ ] Test all signal validation with real webhook data
- [ ] Validate position sizing logic with your account size
- [ ] Confirm portfolio limits match your risk tolerance
- [ ] Set up TradingView webhook to point to your instance

### Phase 2: Backtesting (Week 2)
- [ ] Backtest your existing strategies (if any)
- [ ] Identify underperforming signals
- [ ] Optimize parameters using walk-forward analysis
- [ ] Generate performance reports

### Phase 3: Paper Trading (Week 3)
- [ ] Deploy agents to monitor live markets
- [ ] Execute paper trades (simulated, no real money)
- [ ] Monitor execution latency and slippage
- [ ] Review daily performance reports

### Phase 4: Live Trading (Week 4+)
- [ ] Enable real trading with real money
- [ ] Start with small position sizes (1-2% risk per trade)
- [ ] Monitor daily and review performance
- [ ] Gradually scale up as confidence builds

---

## 🔐 Security Checklist

Before going live, verify:
- [ ] API key rotation (every 90 days)
- [ ] Webhook secret set and verified
- [ ] Rate limiting enabled (10/min default)
- [ ] HTTPS enforced for all endpoints
- [ ] Database encrypted
- [ ] Redis authentication configured
- [ ] Error logs sanitized (no credentials exposed)
- [ ] All environment variables set securely

---

## 📞 Troubleshooting Guide

### Signal not executing?
1. Check Signal Validation logs
2. Verify data freshness (< 5 min)
3. Check confidence score (>= 6/10)
4. Verify portfolio limits not exceeded
5. Check API key permissions

### Position sizing seems wrong?
1. Verify account size in config
2. Check ATR calculation for volatility scaling
3. Review sector exposure limits
4. Check max correlation constraint
5. Validate risk per trade (1% default)

### Backtest shows no trades?
1. Check signal generation parameters
2. Verify historical data is loaded
3. Check entry/exit conditions are correct
4. Review walk-forward window settings
5. Validate commission/slippage assumptions

### Agent not generating signals?
1. Check Market Analyzer is running
2. Verify data API connectivity (yfinance, Finnhub)
3. Review signal thresholds (confidence, scores)
4. Check redis connectivity
5. Review agent logs for errors

---

## 🎯 Key Metrics to Monitor

### Daily
- Signals processed (target: 20-50)
- Win rate (target: > 55%)
- Daily P&L
- Execution latency (target: < 2 sec)
- Portfolio exposure (target: within limits)

### Weekly
- Total trades (target: 50-100)
- Profit factor (target: > 1.5)
- Sharpe ratio (target: > 1.0)
- Max drawdown (target: < 10%)
- Sector imbalance (target: < 5% drift)

### Monthly
- Month return (target: > 2%)
- Strategy consistency (target: < 20% variance)
- Signal accuracy (target: > 60%)
- Agent performance (target: > 99% uptime)
- Backtest vs live correlation (target: > 0.9)

---

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| `SKILLS.md` | Complete skill descriptions and usage |
| `.agents/README.md` | Agent architecture and configuration |
| `skills/backtest-strategy.md` | Backtesting detailed guide |
| `skills/signal-validation.md` | Validation rules and thresholds |
| `skills/portfolio-optimization.md` | Risk management framework |
| `skills/api-security.md` | Security implementation guide |
| `skills/docker-deployment.md` | Docker and production setup |
| `skills/testing-framework.md` | Test coverage and CI/CD |

---

**Last Updated:** 2026-05-21  
**Customized For:** Suhas GM (suhasgm@gmail.com)  
**Version:** 1.0.0 — Production Ready
