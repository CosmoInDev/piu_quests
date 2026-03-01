from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.core.database import get_session
from app.models.user import User

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"

security = HTTPBearer()


async def _get_google_public_keys() -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_JWKS_URL)
        resp.raise_for_status()
        return resp.json()


async def verify_google_token(token: str) -> dict:
    try:
        jwks = await _get_google_public_keys()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=settings.google_client_id,
            options={"verify_exp": True},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    payload = await verify_google_token(credentials.credentials)
    google_id: str = payload.get("sub")
    if not google_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await session.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            google_id=google_id,
            name=payload.get("name", ""),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    return user
