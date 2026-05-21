---
name: market_analyzer
type: agent
version: 1.0.0
---

# Market Analysis Agent

## Purpose
Autonomous agent for continuous market analysis, pattern detection, and trading opportunity identification.

## Capabilities

### 1. Real-Time Market Monitoring
- Monitor price trends across multiple timeframes
- Detect support/resistance levels
- Track volume patterns
- Identify breakouts

### 2. Technical Analysis
- Calculate technical indicators
- Generate trend signals
- Detect chart patterns
- Analyze momentum

### 3. Fundamental Analysis
- Track earnings announcements
- Monitor sector performance
- Watch macro indicators
- Identify catalysts

### 4. Opportunity Detection
- Find trading setups matching strategy
- Rank opportunities by risk/reward
- Filter by market conditions
- Alert on significant moves

## Workflow

```
Monitor Markets
    ↓
Calculate Technicals
    ↓
Analyze Patterns
    ↓
Generate Signals
    ↓
Rank Opportunities
    ↓
Generate Reports
```

## Analysis Scope

- **Symbols:** S&P 500 stocks (top 500 by market cap)
- **Timeframes:** 15min, 1h, 4h, 1d
- **Update Frequency:** Every 5 minutes
- **Historical Lookback:** 2 years

## Key Outputs

- Trading signals (BUY, SELL, WATCH)
- Setup confidence scores
- Risk/reward ratios
- Market regime assessments
- Opportunity reports

## Integration Points

- Technical Indicators Skill
- Market Data APIs (yfinance)
- Signal Generation (AIBrain)
- Database (Signals, Opportunities)
- Notification System (alerts)
