import uuid as _uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.schemas.auth import UserSignup, UserLogin, TokenResponse, UserResponse
from app.models.user import User, UserRole

# Sentinel JWT subjects used for ENV-authenticated Admin/Kitchen principals
_ENV_ADMIN_SUB = "env:admin"
_ENV_KITCHEN_SUB = "env:kitchen"


def _build_env_token_response(sub: str, role: UserRole, name: str) -> TokenResponse:
    """
    Issue JWT tokens and build a TokenResponse for an ENV principal.
    Does NOT touch the database.
    """
    extra = {"role": role.value}
    access_token = create_access_token(subject=sub, extra_claims=extra)
    refresh_token = create_refresh_token(subject=sub, extra_claims=extra)

    synthetic_user = UserResponse(
        id=_uuid.uuid5(_uuid.NAMESPACE_DNS, sub),  # Deterministic UUID from sentinel sub
        email=settings.ADMIN_EMAIL if role == UserRole.ADMIN else settings.KITCHEN_EMAIL,
        full_name="Admin" if role == UserRole.ADMIN else "Kitchen Staff",
        phone=None,
        role=role,
        is_active=True,
        is_verified=True,
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=synthetic_user,
    )


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def signup(self, signup_data: UserSignup) -> TokenResponse:
        existing_user = await self.user_repo.get_by_email(signup_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists."
            )

        hashed_pw = get_password_hash(signup_data.password)

        phone = signup_data.phone.strip() if signup_data.phone else None

        user_dict = {
            "email": signup_data.email,
            "hashed_password": hashed_pw,
            "full_name": signup_data.full_name,
            "phone": phone,
            "role": signup_data.role or UserRole.CUSTOMER,
            "is_active": True,
            "is_verified": True
        }

        user = await self.user_repo.create(user_dict)
        access_token = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
        refresh_token = create_refresh_token(subject=user.id)

        await self.user_repo.update_refresh_token(user.id, refresh_token)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )

    async def login(self, login_data: UserLogin) -> TokenResponse:
        # -------------------------------------------------------------------
        # ENV Admin check — no database involved
        # -------------------------------------------------------------------
        if (
            settings.ADMIN_EMAIL
            and login_data.email == settings.ADMIN_EMAIL
            and login_data.password == settings.ADMIN_PASSWORD
        ):
            return _build_env_token_response(_ENV_ADMIN_SUB, UserRole.ADMIN, "Admin")

        # -------------------------------------------------------------------
        # ENV Kitchen check — no database involved
        # -------------------------------------------------------------------
        if (
            settings.KITCHEN_EMAIL
            and login_data.email == settings.KITCHEN_EMAIL
            and login_data.password == settings.KITCHEN_PASSWORD
        ):
            return _build_env_token_response(_ENV_KITCHEN_SUB, UserRole.KITCHEN, "Kitchen Staff")

        # -------------------------------------------------------------------
        # Standard DB-based authentication (customers and any DB staff)
        # -------------------------------------------------------------------
        user = await self.user_repo.get_by_email(login_data.email)
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive."
            )

        access_token = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
        refresh_token = create_refresh_token(subject=user.id)

        await self.user_repo.update_refresh_token(user.id, refresh_token)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )

    async def refresh_tokens(self, refresh_token_str: str) -> TokenResponse:
        payload = decode_token(refresh_token_str)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload.get("sub")

        # -------------------------------------------------------------------
        # ENV principal refresh — no DB lookup
        # -------------------------------------------------------------------
        if str(user_id).startswith("env:"):
            role_str = payload.get("role", "")
            if user_id == _ENV_ADMIN_SUB:
                return _build_env_token_response(_ENV_ADMIN_SUB, UserRole.ADMIN, "Admin")
            if user_id == _ENV_KITCHEN_SUB:
                return _build_env_token_response(_ENV_KITCHEN_SUB, UserRole.KITCHEN, "Kitchen Staff")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ENV token.")

        # -------------------------------------------------------------------
        # Standard DB refresh (customers)
        # -------------------------------------------------------------------
        user = await self.user_repo.get_by_id(user_id)
        if not user or user.refresh_token != refresh_token_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token."
            )

        new_access = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
        new_refresh = create_refresh_token(subject=user.id)
        await self.user_repo.update_refresh_token(user.id, new_refresh)

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            user=UserResponse.model_validate(user)
        )

    async def guest_login(self, table_id: str = None, restaurant_id: str = None, device_id: str = None) -> TokenResponse:
        import uuid
        guest_email = f"guest_{uuid.uuid4().hex[:8]}@smartserve.guest"
        random_pw = get_password_hash(uuid.uuid4().hex)
        user_dict = {
            "email": guest_email,
            "hashed_password": random_pw,
            "full_name": "Guest Customer",
            "role": UserRole.CUSTOMER,
            "is_active": True,
            "is_verified": False,
            "device_token": device_id,
        }
        if restaurant_id:
            try:
                user_dict["restaurant_id"] = uuid.UUID(str(restaurant_id))
            except ValueError:
                pass

        user = await self.user_repo.create(user_dict)
        access_token = create_access_token(
            subject=user.id,
            extra_claims={"role": user.role.value, "is_guest": True, "table_id": str(table_id) if table_id else None}
        )
        refresh_token = create_refresh_token(subject=user.id)
        await self.user_repo.update_refresh_token(user.id, refresh_token)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )
