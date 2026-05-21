#!/bin/bash

# Start Worker Script - with detailed logging

echo "=== RQ Worker Startup Script ==="
echo "Timestamp: $(date)"
echo "Python Version: $(python --version)"
echo "Current Directory: $(pwd)"
echo ""

# Check environment variables
echo "=== Environment Variables ==="
echo "REDIS_URL: ${REDIS_URL:-NOT SET}"
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-(not set)}"
echo "GEMINI_API_KEY: ${GEMINI_API_KEY:-(not set)}"
echo ""

# If REDIS_URL is not set, try to get it from Railway's auto-generated variable
if [ -z "$REDIS_URL" ]; then
    echo "⚠ REDIS_URL not set, looking for Railway Redis connection..."
    # Railway auto-generates variables like REDIS_*
    if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
        export REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
        echo "✓ Constructed REDIS_URL from REDIS_HOST and REDIS_PORT"
    else
        # Fall back to localhost for development
        export REDIS_URL="redis://trading-redis:6379"
        echo "⚠ Using fallback Redis URL: $REDIS_URL"
    fi
else
    echo "✓ REDIS_URL provided by environment"
fi

echo "Final REDIS_URL: $REDIS_URL"
echo ""

# Test Redis connection
echo "=== Testing Redis Connection ==="
if command -v redis-cli &> /dev/null; then
    redis-cli -u "${REDIS_URL}" ping 2>&1 || echo "⚠ Could not connect to Redis yet (may start after retry)"
else
    echo "redis-cli not available, will test via Python"
fi
echo ""

# Try importing the worker
echo "=== Testing Python Imports ==="
python3 -c "
import sys
print(f'Python Path: {sys.path}')
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
"
echo ""

# Start the worker
echo "=== Starting RQ Worker ==="
echo "Using REDIS_URL: $REDIS_URL"
echo ""

exec rq worker default --url "$REDIS_URL" --with-scheduler
