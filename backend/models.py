from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from datetime import datetime
from database import Base

class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    timeframe = Column(String)
    price = Column(Float)
    condition = Column(String)
    
    # Technical Data (Stored as JSON for flexibility)
    technical_data = Column(JSON, nullable=True)
    
    # AI Assessment
    ai_assessment = Column(String, nullable=True) # BULLISH, BEARISH, NEUTRAL
    ai_confidence = Column(Integer, nullable=True)
    ai_reasoning = Column(JSON, nullable=True)
    
    # Hybrid Score
    hybrid_score = Column(Float, nullable=True)
    action_taken = Column(String, nullable=True) # BUY, SELL, IGNORE
    
    # Performance Tracking
    outcome = Column(String, nullable=True) # WIN, LOSS, PENDING
    pnl = Column(Float, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow)

class Portfolio(Base):
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    quantity = Column(Float, default=0.0)
    average_entry = Column(Float, default=0.0)
    current_exposure = Column(Float, default=0.0)
