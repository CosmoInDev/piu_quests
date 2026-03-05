from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import get_auth_payload, get_current_user
from app.core.database import get_session
from app.models.user import User
from app.schemas.user import NameCheckOut, UserOut, UserRegisterIn, UserUpdateIn

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/check-name", response_model=NameCheckOut)
async def check_name(
    name: str = Query(..., min_length=1),
    _payload: dict = Depends(get_auth_payload),
    session: AsyncSession = Depends(get_session),
) -> NameCheckOut:
    name = name.strip()
    if not name:
        return NameCheckOut(available=False)
    result = await session.execute(select(User).where(User.name == name))
    exists = result.scalar_one_or_none() is not None
    return NameCheckOut(available=not exists)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    body: UserRegisterIn,
    payload: dict = Depends(get_auth_payload),
    session: AsyncSession = Depends(get_session),
) -> User:
    provider: str = payload["provider"]
    sub: str = payload["sub"]

    # Check if already registered with this provider
    if provider == "google":
        existing = await session.execute(select(User).where(User.google_id == sub))
    else:
        existing = await session.execute(select(User).where(User.kakao_id == sub))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="already_registered")

    # Check name uniqueness
    result = await session.execute(select(User).where(User.name == body.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="name_duplicated")

    user = User(
        google_id=sub if provider == "google" else None,
        kakao_id=sub if provider == "kakao" else None,
        name=body.name,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdateIn,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    # Check name uniqueness (exclude self)
    result = await session.execute(
        select(User).where(User.name == body.name, User.id != current_user.id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="name_duplicated",
        )

    current_user.name = body.name
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    await session.delete(current_user)
    await session.commit()
