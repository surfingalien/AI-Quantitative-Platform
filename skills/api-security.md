---
name: api_security
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - /secure-api
  - /audit-security
---

# API Security & Authentication

## Overview

This skill provides guidance on securing the AI-Quantitative Platform API, implementing authentication, protecting against common vulnerabilities, and conducting security audits.

## Authentication & Authorization

### API Key Management
```python
from fastapi import Security, HTTPException, Header
from functools import lru_cache

class APIKeyManager:
    """Secure API key management."""
    
    @staticmethod
    def validate_api_key(api_key: str = Header(...)) -> str:
        """Validate incoming API key."""
        
        # Check key exists and is active
        stored_hash = get_key_hash(api_key)
        if not stored_hash:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Check rate limit for this key
        usage = get_key_usage(api_key)
        if usage['requests_today'] > usage['limit']:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Log access
        log_api_access(api_key, timestamp=now())
        
        return api_key

# Usage in FastAPI
@app.post("/api/trade")
async def execute_trade(trade: TradeRequest, api_key: str = Security(validate_api_key)):
    # Only accessible with valid API key
    return process_trade(trade)
```

### JWT Token Authentication
```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

class JWTManager:
    """JWT token management for trading signals."""
    
    SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    ALGORITHM = "HS256"
    
    @staticmethod
    def create_token(data: dict, expires_delta: timedelta = None) -> str:
        """Create JWT token."""
        
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=1)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """Verify and decode JWT token."""
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
```

## Webhook Security

### HMAC Signature Verification
```python
import hmac
import hashlib
import json

class WebhookValidator:
    """Validate incoming webhooks."""
    
    WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")
    
    @staticmethod
    def verify_signature(payload: bytes, signature: str) -> bool:
        """Verify webhook signature using HMAC."""
        
        # Calculate expected signature
        expected = hmac.new(
            WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (constant time comparison)
        return hmac.compare_digest(expected, signature)

# Usage in webhook endpoint
@app.post("/webhook/tradingview")
async def receive_webhook(request: Request):
    # Get raw body
    body = await request.body()
    
    # Extract signature from headers
    signature = request.headers.get("X-Signature")
    
    # Verify
    if not WebhookValidator.verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Process webhook
    payload = json.loads(body)
    return process_signal(payload)
```

## Input Validation

### Request Validation
```python
from pydantic import BaseModel, Field, validator

class TradeRequest(BaseModel):
    """Validated trade request."""
    
    symbol: str = Field(..., min_length=1, max_length=10)
    quantity: float = Field(..., gt=0, le=1000)
    price: float = Field(..., gt=0)
    
    @validator('symbol')
    def validate_symbol(cls, v):
        # Only allow valid stock symbols
        if not v.isupper() or not v.isalpha():
            raise ValueError('Invalid symbol')
        return v
    
    @validator('price')
    def validate_price(cls, v):
        # Price must be reasonable
        if v > 100000:
            raise ValueError('Price too high')
        return v

# FastAPI automatically validates
@app.post("/api/trade")
async def execute_trade(trade: TradeRequest):
    # Pydantic ensures valid data
    return process_trade(trade)
```

## SQL Injection Prevention

### Parameterized Queries
```python
# ❌ VULNERABLE: String concatenation
query = f"SELECT * FROM signals WHERE symbol = '{symbol}'"
result = db.execute(query)

# ✅ SAFE: Parameterized query
query = "SELECT * FROM signals WHERE symbol = ?"
result = db.execute(query, (symbol,))

# Using SQLAlchemy ORM (safe)
signals = db.query(Signal).filter(Signal.symbol == symbol).all()
```

## XSS Prevention

### Input Sanitization
```python
from html import escape

def sanitize_input(user_input: str) -> str:
    """Remove potentially harmful HTML/JavaScript."""
    
    # Escape HTML special characters
    sanitized = escape(user_input)
    
    # Remove dangerous protocols
    dangerous_protocols = ['javascript:', 'data:', 'vbscript:']
    for protocol in dangerous_protocols:
        sanitized = sanitized.replace(protocol, '')
    
    return sanitized

# In templates
@app.get("/analysis/{symbol}")
async def get_analysis(symbol: str):
    symbol = sanitize_input(symbol)
    analysis = analyze_symbol(symbol)
    return analysis
```

## Rate Limiting

### Per-IP Rate Limiting
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/trade")
@limiter.limit("10/minute")
async def execute_trade(request: Request, trade: TradeRequest):
    return process_trade(trade)
```

### Per-Key Rate Limiting
```python
class RateLimiter:
    """Rate limiting per API key."""
    
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.usage = {}  # {key: [timestamps]}
    
    def is_allowed(self, api_key: str) -> bool:
        """Check if request is allowed."""
        
        now = time.time()
        one_minute_ago = now - 60
        
        # Clean old entries
        if api_key in self.usage:
            self.usage[api_key] = [
                t for t in self.usage[api_key] 
                if t > one_minute_ago
            ]
        else:
            self.usage[api_key] = []
        
        # Check limit
        if len(self.usage[api_key]) >= self.requests_per_minute:
            return False
        
        # Add current request
        self.usage[api_key].append(now)
        return True
```

## CORS Configuration

### Secure CORS Setup
```python
from fastapi.middleware.cors import CORSMiddleware

# Only allow specific origins in production
allowed_origins = [
    "https://yourapp.com",
    "https://api.yourapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # NOT "*" in production!
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

## HTTPS & TLS

### Enforce HTTPS
```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# In production, enforce HTTPS
app.add_middleware(HTTPSRedirectMiddleware)

# Also set HSTS header
@app.middleware("http")
async def add_hsts_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

## Sensitive Data Protection

### Don't Log Sensitive Data
```python
# ❌ DANGEROUS: Logging API keys
logger.info(f"API Key: {api_key}")

# ✅ SAFE: Mask sensitive data
def mask_api_key(key: str) -> str:
    return f"{key[:4]}...{key[-4:]}"

logger.info(f"API Key: {mask_api_key(api_key)}")

# Never log passwords or tokens
logger.info(f"Authenticating user")  # Instead of logging password
```

### Environment Variables
```bash
# .env file (NEVER commit to git!)
ANTHROPIC_API_KEY=sk-...
WEBHOOK_SECRET=secret123
DATABASE_PASSWORD=dbpass

# .gitignore
.env
.env.local
secrets/
```

## Security Audit Checklist

- [ ] HTTPS enabled in production
- [ ] API keys stored in environment variables
- [ ] Webhook signatures validated
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Sensitive data not logged
- [ ] Dependencies up to date
- [ ] No hardcoded secrets
- [ ] Error messages don't leak info
- [ ] Access logs enabled
- [ ] Regular security scans
- [ ] Incident response plan

## Testing Security

### Unit Tests
```python
def test_webhook_signature_validation():
    """Test webhook signature verification."""
    
    payload = b'{"symbol":"AAPL"}'
    valid_sig = generate_signature(payload)
    
    assert WebhookValidator.verify_signature(payload, valid_sig) == True
    assert WebhookValidator.verify_signature(payload, "invalid") == False

def test_rate_limiting():
    """Test rate limiting."""
    
    limiter = RateLimiter(requests_per_minute=5)
    
    # First 5 should pass
    for i in range(5):
        assert limiter.is_allowed("key1") == True
    
    # 6th should fail
    assert limiter.is_allowed("key1") == False
```

## Common Vulnerabilities

### Timing Attacks
```python
# ❌ VULNERABLE: Takes different time based on where comparison fails
if user_password == provided_password:
    grant_access()

# ✅ SAFE: Constant-time comparison
if hmac.compare_digest(user_password, provided_password):
    grant_access()
```

### CSRF Protection
```python
from starlette.middleware.csrf import CSRFMiddleware

app.add_middleware(CSRFMiddleware, secret_key=SECRET_KEY)

# All POST requests must include CSRF token
```

## Monitoring & Logging

### Security Event Logging
```python
def log_security_event(event_type: str, details: dict):
    """Log security-relevant events."""
    
    log_entry = {
        'timestamp': now(),
        'event_type': event_type,  # 'invalid_api_key', 'rate_limit', etc.
        'details': details,
        'severity': get_severity(event_type)
    }
    
    db.save_security_log(log_entry)
    
    # Alert on high severity
    if log_entry['severity'] == 'HIGH':
        send_alert(log_entry)
```

## Implementation Roadmap

1. **Week 1:** Implement API key validation
2. **Week 2:** Add webhook signature verification
3. **Week 3:** Set up rate limiting
4. **Week 4:** Conduct security audit
5. **Week 5:** Fix identified issues
6. **Week 6:** Deploy to production with monitoring

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [API Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/API_Security_Cheat_Sheet.html)
