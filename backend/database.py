import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use SQLite for development to make setup easier, 
# but in production this should be a PostgreSQL URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trading_platform.db")

# Add specific connect_args for SQLite to prevent thread issues
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
