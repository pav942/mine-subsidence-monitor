from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database file will be created at backend/mine_monitor.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./mine_monitor.db"

# check_same_thread=False is required for SQLite + FastAPI (multiple requests)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency used by FastAPI routes to get a DB session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()