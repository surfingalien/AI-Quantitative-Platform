import requests
import json
import time

# Update with your running FastAPI URL
URL = "http://localhost:8000/api/tv-webhook"
SECRET = "MY_SECRET_KEY"

def send_test_signal(symbol="AAPL", timeframe="15m", price=213.55, condition="bullish_engulfing"):
    payload = {
        "secret": SECRET,
        "symbol": symbol,
        "timeframe": timeframe,
        "price": price,
        "condition": condition,
        "timestamp": int(time.time() * 1000),
        "strategy_data": {
            "entry": price,
            "direction": "long"
        }
    }

    print(f"Sending test webhook for {symbol} at ${price}...")
    try:
        response = requests.post(URL, json=payload)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.json()}")
    except Exception as e:
        print(f"Failed to connect to {URL}: {e}")
        print("Make sure your FastAPI server is running! (uvicorn main:app --reload)")

if __name__ == "__main__":
    send_test_signal()
    print("\nCheck your Redis worker terminal to see if the job was processed!")
