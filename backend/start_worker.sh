#!/bin/bash

# Start Worker Script - with detailed logging and fallback logic

echo "=== RQ Worker Startup Script ==="
echo "Timestamp: $(date)"
echo "Python Version: $(python --version)"
echo "Current Directory: $(pwd)"
echo ""

# Check environment variables
echo "=== Railway Environment Variables ==="
echo "REDIS_URL: '${REDIS_URL}'"
echo "REDIS_HOST: '${REDIS_HOST}'"
echo "REDIS_PORT: '${REDIS_PORT}'"
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-(not set)}"
echo "GEMINI_API_KEY: ${GEMINI_API_KEY:-(not set)}"
echo ""

# Determine Redis URL with fallback logic
if [ -n "$REDIS_URL" ] && [ "$REDIS_URL" != "" ]; then
    # REDIS_URL is already set and non-empty
    echo "✓ Using provided REDIS_URL: $REDIS_URL"
    export REDIS_URL
elif [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
    # Construct from REDIS_HOST and REDIS_PORT
    export REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
    echo "✓ Constructed REDIS_URL from REDIS_HOST and REDIS_PORT: $REDIS_URL"
else
    # Fall back to service name for Docker networking
    export REDIS_URL="redis://trading-redis:6379"
    echo "⚠ Using fallback Redis URL (host/port not provided): $REDIS_URL"
fi

echo ""
echo "Final REDIS_URL: '$REDIS_URL'"

# Validate REDIS_URL before proceeding
if [ -z "$REDIS_URL" ]; then
    echo "❌ CRITICAL: REDIS_URL is empty. RQ cannot start."
    exit 1
fi

echo ""

# Test Redis connection with retry logic
echo "=== Testing Redis Connection ==="
max_redis_retries=10
redis_retry=0

while [ $redis_retry -lt $max_redis_retries ]; do
    if command -v redis-cli &> /dev/null; then
        if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
            echo "✓ Redis connection successful"
            break
        fi
    else
        # Try Python Redis import as fallback
        if python3 -c "import redis; r = redis.from_url('$REDIS_URL'); r.ping()" 2>/dev/null; then
            echo "✓ Redis connection successful (verified via Python)"
            break
        fi
    fi

    redis_retry=$((redis_retry + 1))
    if [ $redis_retry -lt $max_redis_retries ]; then
        echo "⚠ Redis not ready (attempt $redis_retry/$max_redis_retries), waiting..."
        sleep 2
    fi
done

if [ $redis_retry -eq $max_redis_retries ]; then
    echo "⚠ Warning: Could not verify Redis connection after $max_redis_retries attempts"
    echo "   Proceeding anyway (Redis may start shortly)..."
fi

echo ""

# Try importing the worker
echo "=== Testing Python Imports ==="
python3 << 'PYEOF'
import sys
import os

print(f'Python Path: {sys.path}')
print(f'REDIS_URL from os.environ: "{os.getenv("REDIS_URL", "NOT SET")}"')

try:
    import redis
    print('✓ redis imported')
except Exception as e:
    print(f'✗ redis import failed: {e}')

try:
    import rq
    print('✓ rq imported')
except Exception as e:
    print(f'✗ rq import failed: {e}')

try:
    from worker import redis_conn
    print('✓ worker redis_conn loaded')
except Exception as e:
    print(f'✗ worker import failed: {e}')
    import traceback
    traceback.print_exc()
PYEOF

echo ""

# Final check before starting RQ
if [ -z "$REDIS_URL" ] || [ "$REDIS_URL" = "" ]; then
    echo "❌ CRITICAL: REDIS_URL is still empty after all fallback logic. Cannot proceed."
    exit 1
fi

# Start the worker
echo "=== Starting RQ Worker ==="
echo "Using REDIS_URL: '$REDIS_URL'"
echo ""

exec rq worker default --url "$REDIS_URL" --with-scheduler
