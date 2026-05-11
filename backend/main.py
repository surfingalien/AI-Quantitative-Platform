from fastapi import FastAPI, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import json
import asyncio
from redis import Redis
import redis.asyncio as aioredis
from rq import Queue
from database import get_db, engine, Base
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import models
from worker import process_webhook_job

# Create Database Tables
Base.metadata.create_all(bind=engine)

# Setup Redis Queue (Sync)
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_conn = Redis.from_url(redis_url)
task_queue = Queue('default', connection=redis_conn)

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="AI Trading Platform")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "MY_SECRET_KEY")

# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# --- Redis Pub/Sub Listener ---
async def redis_listener():
    redis_async = aioredis.from_url(redis_url)
    pubsub = redis_async.pubsub()
    await pubsub.subscribe("signal_updates")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"].decode("utf-8")
                await manager.broadcast(data)
    except Exception as e:
        print(f"Redis Listener Error: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(redis_listener())

# --- Routes ---
@app.get("/")
def read_root():
    return {"status": "AI Trading API is running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/tv-webhook")
@limiter.limit("10/minute")
async def tv_webhook(request: Request):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    if payload.get("secret") != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid Secret")
        
    if not payload.get("symbol"):
        raise HTTPException(status_code=400, detail="Missing symbol")
        
    task_queue.enqueue(process_webhook_job, payload)
    
    return {"status": "accepted", "message": "Signal queued for AI analysis"}

@app.get("/api/signals")
def get_signals(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    signals = db.query(models.Signal).order_by(models.Signal.timestamp.desc()).offset(skip).limit(limit).all()
    return signals

@app.get("/api/portfolio")
def get_portfolio(db: Session = Depends(get_db)):
    portfolio = db.query(models.Portfolio).all()
    return portfolio
