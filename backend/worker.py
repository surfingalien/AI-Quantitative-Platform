import os
import json
from redis import Redis
from rq import Worker, Queue, Connection
from database import SessionLocal
from models import Signal, Portfolio
from ai_engine import analyze_with_claude, calculate_hybrid_score
from indicators import fetch_and_calculate_technicals

redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_conn = Redis.from_url(redis_url)

def process_webhook_job(payload: dict):
    '''
    Background task to process a TradingView webhook.
    '''
    db = SessionLocal()
    try:
        # 1. Enrich with Technical Indicators (Real Market Data via yfinance)
        symbol = payload.get("symbol", "AAPL")
        timeframe = payload.get("timeframe", "15m")
        technical_data = fetch_and_calculate_technicals(symbol, timeframe)
        
        # Merge fetched price if webhook price is missing
        if "current_price" in technical_data and not payload.get("price"):
            payload["price"] = technical_data["current_price"]
        
        # 2. Get Portfolio Context
        portfolios = db.query(Portfolio).all()
        portfolio_context = [{"symbol": p.symbol, "quantity": p.quantity, "exposure": p.current_exposure} for p in portfolios]
        
        # 3. Analyze with Claude
        ai_assessment = analyze_with_claude(payload, portfolio_context, technical_data)
        
        # 4. Calculate Hybrid Score
        confidence = ai_assessment.get("confidence", 5)
        hybrid_score = calculate_hybrid_score(confidence, technical_data)
        
        # 5. Determine Action based on Hybrid Score
        if hybrid_score >= 80:
            action_taken = "STRONG BUY"
        elif hybrid_score >= 60:
            action_taken = "BUY"
        elif hybrid_score >= 40:
            action_taken = "WATCH"
        else:
            action_taken = "IGNORE"
            
        # 6. Save to Database
        new_signal = Signal(
            symbol=payload.get("symbol", "UNKNOWN"),
            timeframe=payload.get("timeframe", "UNKNOWN"),
            price=float(payload.get("price", 0.0)),
            condition=payload.get("condition", "UNKNOWN"),
            technical_data=technical_data,
            ai_assessment=ai_assessment.get("decision", "NEUTRAL"),
            ai_confidence=confidence,
            ai_reasoning=ai_assessment.get("reasoning", []),
            hybrid_score=hybrid_score,
            action_taken=action_taken,
            outcome="PENDING"
        )
        db.add(new_signal)
        db.commit()
        
        print(f"Processed Signal for {new_signal.symbol}. Action: {action_taken}. Score: {hybrid_score}")
        
        # 7. Notify Users (WebSocket/Discord/etc)
        # We publish the full signal dict so WebSockets can broadcast it
        signal_dict = {
            "id": new_signal.id,
            "symbol": new_signal.symbol,
            "timeframe": new_signal.timeframe,
            "action_taken": new_signal.action_taken,
            "hybrid_score": new_signal.hybrid_score,
            "ai_assessment": new_signal.ai_assessment,
            "timestamp": new_signal.timestamp.isoformat()
        }
        redis_conn.publish("signal_updates", json.dumps(signal_dict))
        
    except Exception as e:
        print(f"Failed to process job: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    with Connection(redis_conn):
        worker = Worker(['default'])
        worker.work()
