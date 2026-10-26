import os
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Configurable database URL, defaulting to local SQLite database file
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aicte_cases.db")

# Create engine with appropriate SQLite arguments
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

# Enforce foreign key constraints in SQLite
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# SessionLocal factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session.
    Automatically closes session upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(custom_engine=None) -> None:
    """
    Initializes database tables according to current declarative models.
    """
    target_engine = custom_engine or engine
    Base.metadata.create_all(bind=target_engine)
