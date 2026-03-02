import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_quest_records_empty(client: AsyncClient):
    response = await client.get("/records/quests/1")
    assert response.status_code == 200
    assert response.json() == []
