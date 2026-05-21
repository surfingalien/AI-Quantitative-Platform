---
name: docker_deployment
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - /docker-deploy
  - /container-ops
---

# Docker Deployment & Container Operations

## Overview

This skill provides guidance on containerizing, deploying, and managing the AI-Quantitative Platform using Docker and Docker Compose.

## Building Docker Images

### Backend Dockerfile Optimization
```dockerfile
# Multi-stage build for smaller images

# Stage 1: Builder
FROM python:3.9-slim AS builder

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.9-slim

WORKDIR /app

# Copy only necessary files
COPY --from=builder /root/.local /root/.local
COPY backend/ .

# Add local Python to PATH
ENV PATH=/root/.local/bin:$PATH

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile
```dockerfile
# Build stage
FROM node:18 AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY frontend/next.config.mjs ./

RUN npm ci --production

EXPOSE 3000

CMD ["npm", "start"]
```

## Docker Compose Configuration

### Complete Stack
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: ai-quantitative-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres:
    image: postgres:15-alpine
    container_name: ai-quantitative-postgres
    environment:
      POSTGRES_DB: trading_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: ai-quantitative-backend
    ports:
      - "8000:8000"
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/trading_db
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app:cached
    command: uvicorn main:app --host 0.0.0.0 --reload

  worker:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: ai-quantitative-worker
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/trading_db
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - redis
      - postgres
    command: rq worker default -u redis://redis:6379

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: ai-quantitative-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app:cached

  nginx:
    image: nginx:alpine
    container_name: ai-quantitative-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - backend
      - frontend

volumes:
  redis_data:
  postgres_data:
```

## Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Clean everything
docker-compose down -v
```

### Production Deployment

#### Environment Setup
```bash
# Create .env file
cat > .env << EOF
DB_USER=trading_user
DB_PASSWORD=secure_password_here
ANTHROPIC_API_KEY=sk-...
GEMINI_API_KEY=...
WEBHOOK_SECRET=webhook_secret_here
EOF

# Make sure it's not committed
echo ".env" >> .gitignore
```

#### Deploy to Docker Host
```bash
# Build images
docker-compose build

# Push to registry (if using)
docker tag ai-quantitative-backend:latest myregistry.azurecr.io/backend:latest
docker push myregistry.azurecr.io/backend:latest

# Deploy on host
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-quantitative-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: myregistry.azurecr.io/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-config
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Container Operations

### Health Checks
```python
# In main.py
@app.get("/health")
def health_check():
    """System health check endpoint."""
    
    checks = {
        "redis": check_redis(),
        "database": check_database(),
        "api": "healthy"
    }
    
    all_healthy = all(checks.values())
    status = "healthy" if all_healthy else "unhealthy"
    
    return {
        "status": status,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }

def check_redis():
    """Check Redis connectivity."""
    try:
        redis_conn.ping()
        return True
    except:
        return False

def check_database():
    """Check database connectivity."""
    try:
        db = SessionLocal()
        db.query(Signal).limit(1).all()
        db.close()
        return True
    except:
        return False
```

### Logging

#### Structured Logging
```python
import logging
import json
from pythonjsonlogger import jsonlogger

# Configure JSON logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)

app.logger.addHandler(logHandler)
app.logger.setLevel(logging.INFO)

# Usage
app.logger.info("Signal processed", extra={
    "symbol": "AAPL",
    "decision": "BUY",
    "score": 80.5,
    "user_id": "user123"
})
```

#### Log Aggregation (ELK Stack)
```yaml
# docker-compose.yml addition
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch

filebeat:
  image: docker.elastic.co/beats/filebeat:8.0.0
  volumes:
    - /var/lib/docker/containers:/var/lib/docker/containers:ro
    - /var/run/docker.sock:/var/run/docker.sock:ro
```

### Monitoring with Prometheus
```python
# Add to main.py
from prometheus_client import Counter, Histogram, generate_latest
import time

request_count = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

@app.middleware("http")
async def add_metrics(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

@app.get("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type="text/plain")
```

## Performance Optimization

### Multi-Stage Builds
```dockerfile
# Reduces final image size
# Stage 1: Python deps (can be large)
# Stage 2: Only runtime files (small)

# Final size: ~300MB instead of 900MB
```

### Resource Limits
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Caching Optimization
```dockerfile
# Good: Cache invalidates only when dependencies change
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# Bad: Rebuilds everything on any file change
COPY . .
RUN pip install -r requirements.txt
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs container_name

# Inspect configuration
docker inspect container_name

# Test image locally
docker run -it image_name bash
```

### High Memory Usage
```bash
# Monitor container memory
docker stats

# Set memory limits
docker run -m 512M image_name

# Profile Python memory
pip install memory-profiler
python -m memory_profiler main.py
```

### Slow Performance
```bash
# Check CPU usage
docker stats

# Profile Python code
import cProfile
cProfile.run('process_signal(signal)')

# Check Redis performance
redis-cli --stat
```

## Security Best Practices

1. **Don't run as root**
```dockerfile
RUN useradd -m -u 1000 appuser
USER appuser
```

2. **Use secrets for sensitive data**
```bash
docker run --secret webhook_secret -e WEBHOOK_SECRET=/run/secrets/webhook_secret
```

3. **Scan images for vulnerabilities**
```bash
trivy image myimage:latest
```

4. **Keep dependencies updated**
```bash
pip-audit
docker scan image_name
```

## Deployment Checklist

- [ ] Images build successfully
- [ ] Health checks pass
- [ ] Environment variables configured
- [ ] Volumes mounted correctly
- [ ] Network connectivity working
- [ ] Logs aggregated properly
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Security scans passed
- [ ] Performance acceptable
- [ ] Rollback procedure documented

## Next Steps

1. Build and test Docker images locally
2. Set up container registry
3. Configure CI/CD pipeline for image building
4. Deploy to test environment
5. Monitor and optimize
6. Deploy to production
