---
name: portfolio_optimization
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - /optimize-portfolio
  - /portfolio-risk
---

# Portfolio Optimization & Risk Management

## Overview

This skill provides expert guidance on portfolio allocation, position sizing, risk management, and optimization for quantitative trading systems.

## Key Concepts

### Position Sizing
```python
def calculate_position_size(
    account_size: float,
    risk_percent: float,
    stop_loss_points: float,
    symbol: str
) -> dict:
    """
    Calculate position size using fixed fractional position sizing.
    
    Risk Calculation:
    - Risk Amount = Account Size × Risk % (typically 1-2%)
    - Position Size = Risk Amount / Stop Loss Points
    """
    
    max_risk = account_size * risk_percent
    position_size = max_risk / stop_loss_points
    
    # Validate against max position limit
    max_position = account_size * 0.05  # Max 5% per trade
    position_size = min(position_size, max_position)
    
    return {
        'symbol': symbol,
        'quantity': position_size,
        'risk_amount': max_risk,
        'max_position_limit': max_position,
        'position_percent': (position_size * current_price) / account_size
    }
```

### Portfolio Exposure Limits
```
Single Symbol:      Max 5% of portfolio
Sector:             Max 20% of portfolio
Asset Class:        Max 30% of portfolio
Total Long:         Max 100% (fully invested)
Total Short:        Max 30% (conservative)
Cash Reserve:       Min 5-10% (liquidity)
```

## Risk Management Framework

### Value at Risk (VaR)
```python
def calculate_var(returns: list, confidence_level: float = 0.95) -> float:
    """
    Calculate Value at Risk - max expected loss at confidence level.
    """
    sorted_returns = sorted(returns)
    index = int(len(sorted_returns) * (1 - confidence_level))
    return sorted_returns[index]
```

### Stop Loss Management
```python
def set_stop_loss(entry_price: float, symbol: str, signal_type: str) -> float:
    """
    Calculate appropriate stop loss based on volatility.
    """
    atr = calculate_atr(symbol, periods=14)  # Average True Range
    
    if signal_type == 'BUY':
        stop_loss = entry_price - (2 * atr)
    else:  # SELL
        stop_loss = entry_price + (2 * atr)
    
    return stop_loss
```

### Profit Taking
```python
def set_take_profit(entry_price: float, stop_loss: float) -> float:
    """
    Risk/Reward Ratio = 1:2 (standard)
    """
    risk = abs(entry_price - stop_loss)
    reward = risk * 2  # 1:2 ratio
    
    if entry_price > stop_loss:
        take_profit = entry_price + reward
    else:
        take_profit = entry_price - reward
    
    return take_profit
```

## Portfolio Rebalancing

### Rebalancing Triggers
```python
def should_rebalance(portfolio: Portfolio) -> tuple[bool, str]:
    """
    Determine if portfolio needs rebalancing.
    """
    
    # Check drift from target allocation
    for asset, target_pct in portfolio.targets.items():
        current_pct = portfolio.get_allocation(asset)
        drift = abs(current_pct - target_pct)
        
        if drift > 0.05:  # 5% drift threshold
            return True, f"{asset} drifted {drift:.1%}"
    
    # Check time-based rebalancing
    if (now() - portfolio.last_rebalance).days > 30:
        return True, "Monthly rebalancing due"
    
    return False, "No rebalancing needed"
```

### Rebalancing Process
```python
def rebalance_portfolio(portfolio: Portfolio) -> dict:
    """
    Rebalance portfolio to target allocations.
    """
    trades = []
    
    for asset, target_pct in portfolio.targets.items():
        current_value = portfolio.get_value(asset)
        target_value = portfolio.total_value * target_pct
        
        difference = target_value - current_value
        
        if abs(difference) > 1000:  # Only if significant
            action = 'BUY' if difference > 0 else 'SELL'
            quantity = abs(difference) / get_current_price(asset)
            
            trades.append({
                'symbol': asset,
                'action': action,
                'quantity': quantity,
                'reason': 'Rebalancing'
            })
    
    return {'trades': trades, 'reason': 'Portfolio rebalancing'}
```

## Modern Portfolio Theory (MPT)

### Efficient Frontier
```python
def calculate_efficient_frontier(
    returns: dict,  # Historical returns by asset
    covariance: dict,  # Covariance matrix
    num_portfolios: int = 100
) -> list:
    """
    Generate efficient frontier portfolios.
    """
    
    frontier = []
    for _ in range(num_portfolios):
        # Random weights
        weights = random_weights(returns.keys())
        
        # Calculate return and risk
        expected_return = sum(w * r for w, r in zip(weights, returns.values()))
        portfolio_std = sqrt(sum(w**2 * cov for w, cov in zip(weights, covariance.diagonal())))
        
        sharpe = expected_return / portfolio_std
        
        frontier.append({
            'weights': weights,
            'return': expected_return,
            'risk': portfolio_std,
            'sharpe': sharpe
        })
    
    return sorted(frontier, key=lambda x: x['sharpe'], reverse=True)
```

### Optimal Portfolio (Maximum Sharpe Ratio)
```python
def find_optimal_portfolio(
    returns: dict,
    covariance: dict,
    risk_free_rate: float = 0.02
) -> dict:
    """
    Find portfolio with maximum Sharpe ratio.
    """
    
    frontier = calculate_efficient_frontier(returns, covariance)
    
    for portfolio in frontier:
        sharpe = (portfolio['return'] - risk_free_rate) / portfolio['risk']
        portfolio['sharpe'] = sharpe
    
    optimal = max(frontier, key=lambda x: x['sharpe'])
    return optimal
```

## Correlation & Diversification

### Asset Correlation
```python
def analyze_correlation(holdings: dict) -> dict:
    """
    Analyze correlation between holdings.
    """
    
    correlations = {}
    for i, (asset1, data1) in enumerate(holdings.items()):
        for asset2, data2 in list(holdings.items())[i+1:]:
            corr = calculate_correlation(data1['returns'], data2['returns'])
            
            correlations[f"{asset1}-{asset2}"] = {
                'correlation': corr,
                'diversification_benefit': 'High' if corr < 0.3 else 'Low'
            }
    
    return correlations
```

### Diversification Score
```python
def calculate_diversification_score(portfolio: Portfolio) -> float:
    """
    Score portfolio diversification (0-100).
    """
    
    # Number of uncorrelated assets
    unique_assets = len(portfolio.symbols)
    max_assets = 20
    asset_score = (unique_assets / max_assets) * 50
    
    # Sector concentration
    sector_variance = calculate_sector_variance(portfolio)
    sector_score = min(sector_variance, 50)
    
    return asset_score + sector_score
```

## Implementation Guide

### Step 1: Define Portfolio Targets
```python
target_allocation = {
    'AAPL': 0.20,      # 20% Apple
    'MSFT': 0.15,      # 15% Microsoft
    'GOOGL': 0.15,     # 15% Google
    'SPY': 0.30,       # 30% S&P 500
    'BND': 0.20        # 20% Bonds
}
```

### Step 2: Calculate Position Sizes
```python
account_size = 100000
risk_per_trade = 0.01  # 1%

for symbol, weight in target_allocation.items():
    position_size = calculate_position_size(
        account_size=account_size,
        risk_percent=risk_per_trade,
        stop_loss_points=atr,
        symbol=symbol
    )
    print(f"{symbol}: {position_size['quantity']} shares")
```

### Step 3: Monitor Exposure
```python
# Real-time exposure monitoring
for symbol in portfolio.symbols:
    exposure = portfolio.get_exposure(symbol)
    target = target_allocation[symbol]
    
    if abs(exposure - target) > 0.05:
        print(f"Alert: {symbol} exposure {exposure} vs target {target}")
```

### Step 4: Rebalance
```python
should_rebalance, reason = should_rebalance(portfolio)

if should_rebalance:
    trades = rebalance_portfolio(portfolio)
    execute_trades(trades)
    log_rebalancing(reason, trades)
```

## Risk Monitoring Dashboard

Track these metrics:
```
Portfolio Beta:              X
Portfolio Sharpe Ratio:      Y
Value at Risk (95%):         Z%
Maximum Drawdown:            A%
Correlation with Market:     B%
Sector Concentration:        C%
Largest Position:            D%
```

## Troubleshooting

### "Position size exceeds limit"
**Cause:** High volatility increasing stop loss  
**Fix:** Reduce risk percentage or increase account size

### "Portfolio drift detected"
**Cause:** Market movements changing allocations  
**Fix:** Rebalance portfolio back to targets

### "High correlation detected"
**Cause:** Redundant positions  
**Fix:** Reduce position in correlated assets

## Best Practices

1. **Risk First** - Always define risk before position size
2. **Diversify** - Hold uncorrelated assets
3. **Rebalance Regularly** - Monthly or quarterly
4. **Monitor Exposure** - Real-time tracking
5. **Use Stops** - Always protect trades
6. **Document Targets** - Clear allocation policy
7. **Review Metrics** - Weekly performance check

## Next Steps

1. Implement position sizing module
2. Set up portfolio monitoring
3. Create rebalancing automation
4. Generate risk reports
5. Test with paper trading
