import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_placeholder(client: AsyncClient):
    """Placeholder — photo upload tests require auth + storage mocking."""
    response = await client.get("/health")
    assert response.status_code == 200
