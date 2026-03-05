from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_session
from app.models.user import User

security = HTTPBearer()

SUPPORTED_PROVIDERS = {"google", "kakao"}


def _verify_backend_token(token: str) -> dict:
    """Verify HS256 JWT signed by NextAuth NEXTAUTH_SECRET."""
    try:
        payload = jwt.decode(
            token,
            settings.nextauth_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


def get_auth_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verify backend JWT and return {provider, sub} (no DB access)."""
    payload = _verify_backend_token(credentials.credentials)
    provider: str = payload.get("provider", "")
    sub: str = payload.get("sub", "")
    if not provider or not sub or provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    payload = _verify_backend_token(credentials.credentials)
    provider: str = payload.get("provider", "")
    sub: str = payload.get("sub", "")

    if not provider or not sub or provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    if provider == "google":
        result = await session.execute(select(User).where(User.google_id == sub))
    else:  # kakao
        result = await session.execute(select(User).where(User.kakao_id == sub))

    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="user_not_found",
        )
    return user
