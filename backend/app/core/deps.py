from typing import AsyncGenerator, List, Callable, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import async_session_factory
from app.core.security import decode_token
from app.repositories.user_repository import UserRepository
from app.models.user import User, UserRole

security_scheme = HTTPBearer(auto_error=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found.")
    return user

def require_roles(allowed_roles: List[UserRole]) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this resource."
            )
        return current_user
    return role_checker

async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permission required."
        )
    return current_user

async def get_current_kitchen(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in [UserRole.KITCHEN, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kitchen staff permission required."
        )
    return current_user

async def get_current_customer(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer permission required."
        )
    return current_user

async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        repo = UserRepository(db)
        user = await repo.get_by_id(user_id)
        if user and user.is_active:
            return user
    except Exception:
        pass
    return None


