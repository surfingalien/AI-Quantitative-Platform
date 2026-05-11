import json
import asyncio
from worker import process_webhook_job

# We mock Redis to not crash
import worker
class MockRedis:
    def publish(self, *args, **kwargs):
        pass
worker.redis_conn = MockRedis()

payload = {
    "secret": "MY_SECRET_KEY",
    "symbol": "AAPL",
    "timeframe": "15m",
    "price": 213.55,
    "condition": "bullish_engulfing",
    "timestamp": 1690000000000
}

print("Running mock local test...")
print(f"Incoming payload: {json.dumps(payload, indent=2)}")

process_webhook_job(payload)

print("Test complete. Check the console output above for AI assessment and indicators.")
