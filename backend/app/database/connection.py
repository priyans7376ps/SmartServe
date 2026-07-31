"""
SmartServe Database Connection Module

Manages async database connections using SQLAlchemy with asyncpg.
Provides engine, session factory, and connection lifecycle management.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
    AsyncEngine,
)
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool
from typing import AsyncGenerator

from app.core.config import settings


def create_engine() -> AsyncEngine:
    """
    Create and configure the async database engine.
    
    Returns:
        Configured AsyncEngine instance
    """
    engine_kwargs = {
        "echo": settings.DEBUG,
        "future": True,
        "poolclass": AsyncAdaptedQueuePool,
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    }
    
    # Use NullPool for serverless environments
    if settings.ENVIRONMENT == "production":
        engine_kwargs["poolclass"] = NullPool
    
    return create_async_engine(
        str(settings.DATABASE_URL),
        **engine_kwargs,
    )


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """
    Create an async session factory.
    
    Args:
        engine: AsyncEngine instance
    
    Returns:
        Configured async_sessionmaker
    """
    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


# Global engine and session factory
engine = create_engine()
async_session_factory = create_session_factory(engine)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session.
    Ensures proper session cleanup after use.
    
    Yields:
        AsyncSession instance
    """
    session = async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def init_db():
    """Initialize database - create all tables."""
    from app.database.base import Base
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections gracefully."""
    await engine.dispose()


async def check_db_connection() -> bool:
    """
    Check if database connection is healthy.
    
    Returns:
        True if connection is healthy, False otherwise
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

