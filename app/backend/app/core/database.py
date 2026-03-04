import socket
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def _force_ipv4(database_url: str) -> str:
    """Resolve hostname to IPv4 to avoid ENETUNREACH on platforms without IPv6."""
    parsed = urlparse(database_url)
    hostname = parsed.hostname
    if not hostname:
        return database_url
    try:
        socket.inet_aton(hostname)  # already an IPv4 address
        return database_url
    except OSError:
        pass
    try:
        ipv4 = socket.getaddrinfo(hostname, None, socket.AF_INET)[0][4][0]
        return database_url.replace(f"@{hostname}", f"@{ipv4}", 1)
    except socket.gaierror:
        return database_url


engine = create_async_engine(_force_ipv4(settings.database_url), echo=False)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncSession:
    async with async_session_factory() as session:
        yield session
