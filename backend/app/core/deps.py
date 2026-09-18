import uuid as _uuid
from dataclasses import dataclass, field
from typing import AsyncGenerator, List, Callable, Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import async_session_factory
from app.core.security import decode_token
from app.repositories.user_repository import UserRepository
from app.models.user import User, UserRole

security_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# ENV Principal — lightweight stand-in for Admin/Kitchen ENV-authenticated users.
# Satisfies the .role, .full_name, .id, .email, .is_active, .is_verified,
# .phone, .hashed_password interface used by existing route handlers.
# ---------------------------------------------------------------------------
@dataclass
class EnvPrincipal:
    """Represents an ENV-authenticated Admin or Kitchen principal (no DB row)."""
    role: UserRole
    email: str
    full_name: str
    id: _uuid.UUID = field(default_factory=_uuid.uuid4)
    is_active: bool = True
    is_verified: bool = True
    phone: Optional[str] = None
    hashed_password: str = ""          # Not usable — ENV admin cannot change PW via API
    refresh_token: Optional[str] = None

    # Satisfy attribute access used in admin router's update_profile / change-password
    def __getattr__(self, name):
        return None

# Sentinel subject prefixes embedded in JWT for ENV principals
_ENV_ADMIN_SUB = "env:admin"
_ENV_KITCHEN_SUB = "env:kitchen"


def _make_env_principal(sub: str, role_str: str) -> EnvPrincipal:
    """Return a role-appropriate EnvPrincipal for the given JWT subject."""
    if sub == _ENV_ADMIN_SUB:
        return EnvPrincipal(
            role=UserRole.ADMIN,
            email="admin@smartserve.env",
            full_name="Admin (ENV)",
        )
    if sub == _ENV_KITCHEN_SUB:
        return EnvPrincipal(
            role=UserRole.KITCHEN,
            email="kitchen@smartserve.env",
            full_name="Kitchen Staff (ENV)",
        )
    # Fallback — should not reach here in normal flow
    return EnvPrincipal(
        role=UserRole(role_str) if role_str else UserRole.ADMIN,
        email=f"{sub}@smartserve.env",
        full_name="ENV Principal",
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Union[User, EnvPrincipal]:
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

    # --- ENV principal fast-path: no DB lookup ---
    if str(user_id).startswith("env:"):
        role_str = payload.get("role", "")
        return _make_env_principal(str(user_id), role_str)

    # --- Normal customer/DB path ---
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found.")
    return user

def require_roles(allowed_roles: List[UserRole]) -> Callable:
    async def role_checker(current_user: Union[User, EnvPrincipal] = Depends(get_current_user)) -> Union[User, EnvPrincipal]:
        if current_user.role not in allowed_roles and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this resource."
            )
        return current_user
    return role_checker

async def get_current_admin(
    current_user: Union[User, EnvPrincipal] = Depends(get_current_user)
) -> Union[User, EnvPrincipal]:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permission required."
        )
    return current_user

async def get_current_kitchen(
    current_user: Union[User, EnvPrincipal] = Depends(get_current_user)
) -> Union[User, EnvPrincipal]:
    if current_user.role not in [UserRole.KITCHEN, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kitchen staff permission required."
        )
    return current_user

async def get_current_customer(
    current_user: Union[User, EnvPrincipal] = Depends(get_current_user)
) -> Union[User, EnvPrincipal]:
    if current_user.role not in [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer permission required."
        )
    return current_user

async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[Union[User, EnvPrincipal]]:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        # ENV principal fast-path
        if str(user_id).startswith("env:"):
            role_str = payload.get("role", "")
            return _make_env_principal(str(user_id), role_str)
        repo = UserRepository(db)
        user = await repo.get_by_id(user_id)
        if user and user.is_active:
            return user
    except Exception:
        pass
    return None


