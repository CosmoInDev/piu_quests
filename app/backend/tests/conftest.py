import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Import all models first to register them with Base.metadata
import app.models.user  # noqa: F401
import app.models.quest  # noqa: F401
import app.models.chart  # noqa: F401
import app.models.participant  # noqa: F401
import app.models.record  # noqa: F401
import app.models.record_item  # noqa: F401
import app.models.photo  # noqa: F401

from app.main import app as fastapi_app
from app.core.database import Base, get_session
from app.core.auth import get_current_user
from app.models.user import User

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(test_engine, expire_on_commit=False)


async def override_get_session() -> AsyncSession:
    async with test_session_factory() as session:
        yield session


fastapi_app.dependency_overrides[get_session] = override_get_session


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def authenticated_client() -> AsyncClient:
    """Client with auth override — creates a test user in DB and overrides get_current_user."""
    async with test_session_factory() as session:
        user = User(google_id="test-google-id", name="Test User")
        session.add(user)
        await session.commit()
        await session.refresh(user)
        test_user = user

    async def override_get_current_user():
        return test_user

    fastapi_app.dependency_overrides[get_current_user] = override_get_current_user
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as ac:
        yield ac
    fastapi_app.dependency_overrides.pop(get_current_user, None)
