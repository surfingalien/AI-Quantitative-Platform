---
name: testing_framework
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - /run-tests
  - /test-coverage
---

# Testing Framework & Quality Assurance

## Overview

This skill provides guidance on setting up and maintaining comprehensive tests for the AI-Quantitative Platform, including unit tests, integration tests, and backtesting validation.

## Testing Strategy

### Test Pyramid
```
        /\
       /  \
      / E2E \         Integration tests (slow, comprehensive)
     /______\
      /    \
     / Unit \        Unit tests (fast, isolated)
    /______\
```

### Test Coverage Targets
```
Backend:       >= 80% code coverage
Critical Path: >= 95% code coverage
APIs:          100% endpoint coverage
Agents:        >= 90% logic coverage
```

## Unit Testing

### Agent Tests
```python
import pytest
from agents import AIBrain, MarketResearchAgent, TechnicalResearchAgent

class TestMarketResearchAgent:
    """Test market research agent."""
    
    def setup_method(self):
        self.agent = MarketResearchAgent()
    
    def test_valid_symbol(self):
        """Test research with valid symbol."""
        result = self.agent.research_fundamentals("AAPL")
        
        assert isinstance(result, str)
        assert "AAPL" in result or "Failed" in result
        assert len(result) > 0
    
    def test_invalid_symbol(self):
        """Test research with invalid symbol."""
        result = self.agent.research_fundamentals("INVALID123XYZ")
        
        assert "Failed" in result or "Error" in result
    
    def test_empty_symbol(self):
        """Test with empty symbol."""
        with pytest.raises(ValueError):
            self.agent.research_fundamentals("")

class TestTechnicalResearchAgent:
    """Test technical research agent."""
    
    def setup_method(self):
        self.agent = TechnicalResearchAgent()
    
    def test_overbought_detection(self):
        """Test overbought condition detection."""
        data = {"trend": "uptrend", "rsi_14": 75, "volume_spike": False}
        result = self.agent.analyze_price_action("AAPL", data, "15m")
        
        assert "overbought" in result.lower()
    
    def test_oversold_detection(self):
        """Test oversold condition detection."""
        data = {"trend": "downtrend", "rsi_14": 25, "volume_spike": False}
        result = self.agent.analyze_price_action("AAPL", data, "15m")
        
        assert "oversold" in result.lower()
    
    def test_rsi_range(self):
        """Test RSI value handling."""
        for rsi in [0, 25, 50, 75, 100]:
            data = {"trend": "uptrend", "rsi_14": rsi, "volume_spike": False}
            result = self.agent.analyze_price_action("AAPL", data, "15m")
            
            assert isinstance(result, str)
            assert "RSI" in result
```

### Scoring Engine Tests
```python
class TestHybridScoringEngine:
    """Test hybrid scoring algorithm."""
    
    def test_strong_buy_signal(self):
        """Test strong buy signal scoring."""
        from ai_engine import calculate_hybrid_score
        
        data = {
            "trend": "strong_uptrend",
            "rsi_14": 65,
            "volume_spike": True
        }
        score = calculate_hybrid_score(8, data)
        
        assert score >= 80
        assert isinstance(score, float)
    
    def test_watch_signal(self):
        """Test watch signal scoring."""
        from ai_engine import calculate_hybrid_score
        
        data = {
            "trend": "downtrend",
            "rsi_14": 35,
            "volume_spike": False
        }
        score = calculate_hybrid_score(5, data)
        
        assert 40 <= score < 60
    
    def test_null_handling(self):
        """Test null value handling."""
        from ai_engine import calculate_hybrid_score
        
        # Should not crash with None values
        data = {"trend": None, "rsi_14": None, "volume_spike": None}
        score = calculate_hybrid_score(5, data)
        
        assert isinstance(score, float)
        assert 0 <= score <= 100
    
    def test_edge_values(self):
        """Test edge case values."""
        from ai_engine import calculate_hybrid_score
        
        # Min confidence
        score = calculate_hybrid_score(0, {"trend": "downtrend", "rsi_14": 20})
        assert score >= 0
        
        # Max confidence
        score = calculate_hybrid_score(10, {"trend": "strong_uptrend", "rsi_14": 80})
        assert score <= 100
```

## Integration Testing

### Webhook Processing Tests
```python
class TestWebhookProcessing:
    """Test complete webhook processing pipeline."""
    
    @pytest.fixture
    def sample_webhook(self):
        return {
            "symbol": "AAPL",
            "timeframe": "15m",
            "price": 180.45,
            "condition": "bullish_alert"
        }
    
    def test_full_pipeline(self, sample_webhook):
        """Test complete signal processing."""
        from worker import process_webhook_job
        
        # Process webhook
        process_webhook_job(sample_webhook)
        
        # Verify signal was created
        signal = db.query(Signal).filter(
            Signal.symbol == "AAPL"
        ).order_by(Signal.timestamp.desc()).first()
        
        assert signal is not None
        assert signal.ai_assessment in ["BUY", "SELL", "NEUTRAL"]
        assert 0 <= signal.hybrid_score <= 100
    
    def test_portfolio_context_applied(self, sample_webhook):
        """Test portfolio context is applied."""
        from worker import process_webhook_job
        
        # Add holdings
        portfolio = Portfolio(symbol="AAPL", quantity=100)
        db.add(portfolio)
        db.commit()
        
        # Process webhook
        process_webhook_job(sample_webhook)
        
        # Verify context was considered
        signal = db.query(Signal).order_by(Signal.timestamp.desc()).first()
        assert signal.technical_data is not None
```

### API Tests
```python
class TestAPIs:
    """Test API endpoints."""
    
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        return TestClient(app)
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_webhook_with_valid_signature(self, client):
        """Test webhook with valid signature."""
        payload = b'{"symbol":"AAPL"}'
        signature = generate_signature(payload)
        
        response = client.post(
            "/webhook/tradingview",
            content=payload,
            headers={"X-Signature": signature}
        )
        assert response.status_code == 200
    
    def test_webhook_with_invalid_signature(self, client):
        """Test webhook with invalid signature."""
        payload = b'{"symbol":"AAPL"}'
        
        response = client.post(
            "/webhook/tradingview",
            content=payload,
            headers={"X-Signature": "invalid"}
        )
        assert response.status_code == 401
```

## Backtesting Tests

### Signal Validation Tests
```python
class TestSignalValidation:
    """Test signal validation logic."""
    
    def test_valid_signal(self):
        """Test valid signal passes validation."""
        from validation import SignalValidator
        
        validator = SignalValidator()
        signal = {
            'symbol': 'AAPL',
            'decision': 'BUY',
            'confidence': 8,
            'price': 180.45,
            'timestamp': now()
        }
        
        is_valid, errors = validator.validate(signal)
        assert is_valid == True
        assert len(errors) == 0
    
    def test_missing_field(self):
        """Test missing required field."""
        from validation import SignalValidator
        
        validator = SignalValidator()
        signal = {
            'symbol': 'AAPL',
            'decision': 'BUY',
            # Missing: confidence, price, timestamp
        }
        
        is_valid, errors = validator.validate(signal)
        assert is_valid == False
        assert len(errors) > 0
    
    def test_invalid_confidence(self):
        """Test invalid confidence value."""
        from validation import SignalValidator
        
        validator = SignalValidator()
        signal = {
            'symbol': 'AAPL',
            'decision': 'BUY',
            'confidence': 15,  # Out of range
            'price': 180.45,
            'timestamp': now()
        }
        
        is_valid, errors = validator.validate(signal)
        assert is_valid == False
```

## Performance Tests

### Load Testing
```python
import asyncio
from locust import HttpUser, task

class LoadTestUser(HttpUser):
    """Simulate trading signal load."""
    
    @task
    def send_signal(self):
        """Send trading signal."""
        self.client.post(
            "/api/signal",
            json={
                "symbol": "AAPL",
                "decision": "BUY",
                "confidence": 8
            }
        )
    
    @task
    def get_portfolio(self):
        """Get portfolio."""
        self.client.get("/api/portfolio")
```

Run with:
```bash
locust -f tests/load_tests.py --host=http://localhost:8000
```

## Running Tests

### Execute All Tests
```bash
# Run all tests with coverage
pytest --cov=backend tests/

# Run specific test file
pytest tests/test_agents.py -v

# Run specific test class
pytest tests/test_agents.py::TestMarketResearchAgent -v

# Run with markers
pytest -m integration  # Only integration tests
```

### CI/CD Pipeline
```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - run: pip install -r requirements.txt
      - run: pytest --cov=backend tests/
      - run: coverage report --fail-under=80
```

## Best Practices

1. **Test Pyramid:** Many unit tests, some integration tests, few E2E tests
2. **Isolation:** Tests should not depend on each other
3. **Mocking:** Mock external services (APIs, databases)
4. **Speed:** Unit tests should run in < 1 second
5. **Clarity:** Test names should describe what they test
6. **Coverage:** Aim for >= 80% code coverage
7. **Documentation:** Include docstrings explaining complex tests

## Coverage Report
```bash
pytest --cov=backend --cov-report=html tests/
# Open htmlcov/index.html in browser
```

## Troubleshooting

### "Test passes locally but fails in CI"
- **Cause:** Environment differences
- **Fix:** Check Python version, dependencies, environment variables

### "Tests are slow"
- **Cause:** Too many real API calls, database queries
- **Fix:** Use mocks, reduce test data size

### "Flaky tests"
- **Cause:** Race conditions, timing issues
- **Fix:** Add proper waits, use fixtures for cleanup

## Next Steps

1. Set up pytest framework
2. Write unit tests for all agents
3. Add integration tests
4. Set up CI/CD pipeline
5. Achieve 80%+ coverage
