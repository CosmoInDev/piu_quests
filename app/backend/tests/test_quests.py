import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_quests_empty(client: AsyncClient):
    response = await client.get("/quests")
    assert response.status_code == 200
    assert response.json() == []
