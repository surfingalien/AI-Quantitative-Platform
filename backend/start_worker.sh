#!/bin/bash

set -e

echo "=== RQ Worker Startup Script ==="
echo "Timestamp: $(date)"
echo "Python Version: $(python --version)"
echo "Current Directory: $(pwd)"
echo ""

# Use provided REDIS_URL or default to service DNS name for Docker networking
REDIS_URL="${REDIS_URL:-redis://trading-redis:6379}"

echo "Configured REDIS_URL: $REDIS_URL"
echo ""

# Validate REDIS_URL format before proceeding
if [[ ! "$REDIS_URL" =~ ^redis(s)?:// ]]; then
    echo "❌ CRITICAL: REDIS_URL has invalid scheme: $REDIS_URL"
    exit 1
fi

# Test Redis connection with retries
echo "=== Testing Redis Connection ==="
max_retries=15
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if python3 << 'PYEOF'
import redis
import sys
import os

try:
    r = redis.from_url(os.getenv('REDIS_URL'))
    r.ping()
    print('✓ Redis is ready')
    sys.exit(0)
except Exception as e:
    sys.exit(1)
PYEOF
    then
        echo "✓ Redis connection verified"
        break
    fi

    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $max_retries ]; then
        echo "⚠ Redis not ready (attempt $retry_count/$max_retries), waiting 2s..."
        sleep 2
    fi
done

if [ $retry_count -eq $max_retries ]; then
    echo "⚠ Could not verify Redis connection after $max_retries attempts"
    echo "   Proceeding anyway - Redis may still be starting..."
fi

echo ""

# Verify Python imports
echo "=== Verifying Python Dependencies ==="
python3 << 'PYEOF'
import sys

try:
    import redis
    print("✓ redis module available")
except ImportError as e:
    print(f"✗ Failed to import redis: {e}")
    sys.exit(1)

try:
    import rq
    print("✓ rq module available")
except ImportError as e:
    print(f"✗ Failed to import rq: {e}")
    sys.exit(1)

try:
    from worker import process_webhook_job
    print("✓ worker module available")
except ImportError as e:
    print(f"✗ Failed to import worker: {e}")
    sys.exit(1)

print("✓ All dependencies verified")
PYEOF

echo ""
echo "=== Starting RQ Worker ==="
echo "Command: rq worker default --url '$REDIS_URL' --with-scheduler"
echo ""

# Export for child process and start worker
export REDIS_URL
exec rq worker default --url "$REDIS_URL" --with-scheduler
