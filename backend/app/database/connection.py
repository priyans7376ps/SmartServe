"""
SmartServe Database Connection Module

Manages async database connections using SQLAlchemy with asyncpg.
Provides engine, session factory, and connection lifecycle management.
"""

from sqlalchemy import text
from sqlalchemy.engine import make_url
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

    Converts PostgreSQL URLs to use asyncpg automatically.
    """

    database_url = make_url(str(settings.DATABASE_URL))

    # Render/PostgreSQL URLs may come as:
    # postgresql://
    # postgresql+psycopg2://
    #
    # Our application uses SQLAlchemy AsyncEngine,
    # so PostgreSQL must use asyncpg.
    if database_url.drivername in {
        "postgresql",
        "postgresql+psycopg2",
    }:
        database_url = database_url.set(
            drivername="postgresql+asyncpg"
        )

    database_url = database_url.render_as_string(
        hide_password=False
    )

    # Production / Render
    if settings.ENVIRONMENT == "production":
        return create_async_engine(
            database_url,
            echo=settings.DEBUG,
            future=True,
            poolclass=NullPool,
        )

    # Local development
    return create_async_engine(
        database_url,
        echo=settings.DEBUG,
        future=True,
        poolclass=AsyncAdaptedQueuePool,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600,
    )


def create_session_factory(
    engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    """
    Create an async session factory.
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
        True if connection is healthy, False otherwise.
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

        return True

    except Exception:
        return False