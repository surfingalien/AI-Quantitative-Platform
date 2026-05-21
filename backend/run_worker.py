#!/usr/bin/env python3
"""
Pure Python worker launcher with explicit Redis connection setup.
Completely bypasses shell script complexity and RQ CLI early initialization issues.
"""
import os
import sys
import time
import logging
from redis import Redis
from rq import Worker, Queue, Connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Step 1: Get and validate REDIS_URL
# ============================================================================
def get_redis_url() -> str:
    """Get REDIS_URL from environment with fallback and validation."""
    # Try to get from environment
    redis_url = os.getenv('REDIS_URL')

    # Debug: log the raw value
    logger.info(f"DEBUG: Raw REDIS_URL from environment: {repr(redis_url)}")
    logger.info(f"DEBUG: REDIS_URL length: {len(redis_url) if redis_url else 0}")

    # If empty, None, or whitespace, use default
    if not redis_url or not redis_url.strip():
        logger.warning("REDIS_URL is empty or whitespace, using fallback")
        redis_url = 'redis://trading-redis:6379'
        logger.info(f"Using fallback REDIS_URL: {redis_url}")
    else:
        redis_url = redis_url.strip()
        logger.info(f"Using REDIS_URL from environment: {redis_url}")

    # Validate format
    if not redis_url.startswith(('redis://', 'rediss://', 'unix://')):
        logger.error(f"❌ CRITICAL: Invalid REDIS_URL scheme: {redis_url}")
        logger.error("   Must start with redis://, rediss://, or unix://")
        logger.error(f"   Got: {repr(redis_url)}")
        sys.exit(1)

    return redis_url


# ============================================================================
# Step 2: Test Redis connection with retries
# ============================================================================
def test_redis_connection(redis_url: str, max_retries: int = 15) -> Redis:
    """Test Redis connection, retrying up to max_retries times."""
    redis_conn = None

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Attempting Redis connection (attempt {attempt}/{max_retries})...")
            redis_conn = Redis.from_url(redis_url)
            redis_conn.ping()
            logger.info("✓ Redis connection verified")
            return redis_conn
        except Exception as e:
            logger.warning(f"⚠ Redis not ready: {e}")
            if attempt < max_retries:
                logger.info(f"  Waiting 2 seconds before retry...")
                time.sleep(2)
            else:
                logger.error(f"❌ Failed to connect to Redis after {max_retries} attempts")
                raise


# ============================================================================
# Step 3: Verify Python dependencies
# ============================================================================
def verify_dependencies() -> None:
    """Verify all required Python modules are available."""
    logger.info("Verifying Python dependencies...")

    required_modules = {
        'redis': 'redis',
        'rq': 'rq',
        'database': 'database module (SQLAlchemy)',
        'models': 'models module (SQLAlchemy)',
        'ai_engine': 'ai_engine module',
        'indicators': 'indicators module',
        'worker': 'worker module (process_webhook_job)',
    }

    for import_name, display_name in required_modules.items():
        try:
            if import_name == 'database':
                from database import SessionLocal
            elif import_name == 'models':
                from models import Signal, Portfolio
            elif import_name == 'ai_engine':
                from ai_engine import analyze_with_claude, calculate_hybrid_score
            elif import_name == 'indicators':
                from indicators import fetch_and_calculate_technicals
            elif import_name == 'worker':
                from worker import process_webhook_job
            else:
                __import__(import_name)
            logger.info(f"✓ {display_name}")
        except ImportError as e:
            logger.error(f"✗ Failed to import {display_name}: {e}")
            sys.exit(1)


# ============================================================================
# Step 4: Import worker function
# ============================================================================
def get_worker_function():
    """Import and return the worker function."""
    try:
        from worker import process_webhook_job
        logger.info("✓ Worker function imported")
        return process_webhook_job
    except ImportError as e:
        logger.error(f"✗ Failed to import worker function: {e}")
        sys.exit(1)


# ============================================================================
# Step 5: Start RQ worker programmatically
# ============================================================================
def start_worker(redis_url: str) -> None:
    """Start the RQ worker programmatically."""
    logger.info("="*60)
    logger.info("Starting RQ Worker")
    logger.info("="*60)

    try:
        # Connect to Redis
        redis_conn = Redis.from_url(redis_url)

        # Start worker
        with Connection(redis_conn):
            queue = Queue('default', connection=redis_conn)
            worker = Worker(['default'], connection=redis_conn)
            logger.info(f"✓ Worker started, listening on queue 'default'")
            logger.info(f"  Connected to Redis: {redis_url}")
            logger.info("  Press Ctrl+C to stop")
            logger.info("="*60)
            worker.work()
    except KeyboardInterrupt:
        logger.info("\n✓ Worker stopped by user (Ctrl+C)")
        sys.exit(0)
    except Exception as e:
        logger.error(f"✗ Worker error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


# ============================================================================
# Main execution
# ============================================================================
def main():
    """Main entry point."""
    logger.info("="*60)
    logger.info("RQ Worker Launcher")
    logger.info("="*60)

    # Step 1: Get and validate REDIS_URL
    try:
        redis_url = get_redis_url()
    except SystemExit:
        sys.exit(1)

    # Step 2: Test Redis connection
    try:
        logger.info("Testing Redis connection...")
        redis_conn = test_redis_connection(redis_url)
        redis_conn.close()  # Close test connection, we'll create a new one in worker
    except Exception as e:
        logger.error(f"✗ Redis connection test failed: {e}")
        sys.exit(1)

    # Step 3: Verify dependencies
    try:
        verify_dependencies()
    except SystemExit:
        sys.exit(1)

    # Step 4: Start worker
    logger.info("")
    start_worker(redis_url)


if __name__ == '__main__':
    main()
