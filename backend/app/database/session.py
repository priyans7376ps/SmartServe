"""
SmartServe Database Session Module

Provides database session management utilities including context managers
and dependency injection for FastAPI endpoints.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, AsyncContextManager, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from app.database.connection import async_session_factory, engine
from app.core.config import settings


class DatabaseSessionManager:
    """
    Manages database sessions with support for transactions,
    nested sessions, and automatic cleanup.
    """
    
    def __init__(self):
        self._session_factory = async_session_factory
        self._engine = engine
    
    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Provide a transactional scope around a series of operations.
        
        Yields:
            AsyncSession instance with automatic commit/rollback
        """
        session = self._session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
    
    @asynccontextmanager
    async def transaction(self, session: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
        """
        Provide a nested transactional scope.
        
        Args:
            session: Existing session to use
            
        Yields:
            Same session with savepoint support
        """
        if session.in_transaction():
            # Create savepoint for nested transactions
            async with session.begin_nested():
                yield session
        else:
            async with session.begin():
                yield session
    
    async def execute_raw_sql(self, sql: str, params: dict = None) -> Any:
        """
        Execute raw SQL with parameter binding.
        
        Args:
            sql: Raw SQL query string
            params: Query parameters
        
        Returns:
            Query result
        """
        async with self.session() as session:
            result = await session.execute(text(sql), params or {})
            return result
    
    async def health_check(self) -> bool:
        """
        Check database connectivity.
        
        Returns:
            True if database is reachable
        """
        try:
            async with self.session() as session:
                await session.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
    
    async def get_table_count(self, table_name: str) -> int:
        """
        Get the count of rows in a table.
        
        Args:
            table_name: Name of the table
        
        Returns:
            Number of rows
        """
        async with self.session() as session:
            result = await session.execute(
                text(f"SELECT COUNT(*) FROM {table_name}")
            )
            return result.scalar()


# Global session manager instance
session_manager = DatabaseSessionManager()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database sessions.
    Ensures proper session cleanup after request completion.
    
    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    
    Yields:
        AsyncSession instance
    """
    async with session_manager.session() as session:
        yield session


async def get_transaction_session(db: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for transactional database sessions.
    
    Usage:
        @app.post("/items")
        async def create_item(
            db: AsyncSession = Depends(get_transaction_session)
        ):
            ...
    
    Yields:
        AsyncSession with transaction management
    """
    async with session_manager.transaction(db) as session:
        yield session

