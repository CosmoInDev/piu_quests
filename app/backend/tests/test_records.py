import pytest
from datetime import date, timedelta
from httpx import AsyncClient


async def _create_quest(client: AsyncClient) -> dict:
    """Helper to create a quest with 3 charts."""
    today = date.today()
    charts = [
        {"song_name": f"Song {i}", "difficulty": f"S{19 + i}", "order": i}
        for i in range(3)
    ]
    body = {
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=6)).isoformat(),
        "charts": charts,
    }
    resp = await client.post("/quests", json=body)
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_list_quest_records_empty(client: AsyncClient):
    response = await client.get("/records/quests/1")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_submit_record_creates_items(authenticated_client: AsyncClient):
    quest = await _create_quest(authenticated_client)
    quest_id = quest["id"]
    chart = quest["charts"][0]

    body = {
        "items": [
            {
                "chart_id": chart["id"],
                "song_name": chart["song_name"],
                "difficulty": chart["difficulty"],
                "score": 900000,
                "file_url": "http://example.com/photo1.jpg",
            }
        ]
    }
    resp = await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["score"] == 900000
    assert data["items"][0]["photo"]["file_url"] == "http://example.com/photo1.jpg"


@pytest.mark.asyncio
async def test_submit_record_rejects_duplicate_chart_ids(authenticated_client: AsyncClient):
    quest = await _create_quest(authenticated_client)
    quest_id = quest["id"]
    chart = quest["charts"][0]

    body = {
        "items": [
            {
                "chart_id": chart["id"],
                "song_name": "Song A",
                "difficulty": "S19",
                "score": 900000,
                "file_url": "http://example.com/a.jpg",
            },
            {
                "chart_id": chart["id"],
                "song_name": "Song A",
                "difficulty": "S19",
                "score": 950000,
                "file_url": "http://example.com/b.jpg",
            },
        ]
    }
    resp = await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_submit_record_overwrites_existing_items(authenticated_client: AsyncClient):
    quest = await _create_quest(authenticated_client)
    quest_id = quest["id"]
    chart = quest["charts"][0]

    # First submission
    body1 = {
        "items": [
            {
                "chart_id": chart["id"],
                "song_name": chart["song_name"],
                "difficulty": chart["difficulty"],
                "score": 800000,
                "file_url": "http://example.com/old.jpg",
            }
        ]
    }
    resp1 = await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body1)
    assert resp1.status_code == 200

    # Second submission for same chart — should replace
    body2 = {
        "items": [
            {
                "chart_id": chart["id"],
                "song_name": chart["song_name"],
                "difficulty": chart["difficulty"],
                "score": 950000,
                "file_url": "http://example.com/new.jpg",
            }
        ]
    }
    resp2 = await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body2)
    assert resp2.status_code == 200
    data = resp2.json()

    # Should only have 1 item for this chart, with the new score
    chart_items = [i for i in data["items"] if i["chart_id"] == chart["id"]]
    assert len(chart_items) == 1
    assert chart_items[0]["score"] == 950000


@pytest.mark.asyncio
async def test_submit_record_validates_chart_belongs_to_quest(authenticated_client: AsyncClient):
    quest = await _create_quest(authenticated_client)
    quest_id = quest["id"]

    body = {
        "items": [
            {
                "chart_id": 99999,
                "song_name": "Nonexistent",
                "difficulty": "S99",
                "score": 100,
                "file_url": "http://example.com/x.jpg",
            }
        ]
    }
    resp = await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_submit_removes_missing_items(authenticated_client: AsyncClient):
    """Full-sync: items not in the new request are deleted."""
    quest = await _create_quest(authenticated_client)
    quest_id = quest["id"]

    # Submit 2 items
    body1 = {
        "items": [
            {
                "chart_id": quest["charts"][0]["id"],
                "song_name": quest["charts"][0]["song_name"],
                "difficulty": quest["charts"][0]["difficulty"],
                "score": 900000,
                "file_url": "http://example.com/a.jpg",
            },
            {
                "chart_id": quest["charts"][1]["id"],
                "song_name": quest["charts"][1]["song_name"],
                "difficulty": quest["charts"][1]["difficulty"],
                "score": 850000,
                "file_url": "http://example.com/b.jpg",
            },
        ]
    }
    resp1 = await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body1)
    assert resp1.status_code == 200
    assert len(resp1.json()["items"]) == 2

    # Re-submit with only 1 item — the other should be deleted
    body2 = {
        "items": [
            {
                "chart_id": quest["charts"][0]["id"],
                "song_name": quest["charts"][0]["song_name"],
                "difficulty": quest["charts"][0]["difficulty"],
                "score": 920000,
                "file_url": "http://example.com/a.jpg",
            },
        ]
    }
    resp2 = await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body2)
    assert resp2.status_code == 200
    data = resp2.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["chart_id"] == quest["charts"][0]["id"]
    assert data["items"][0]["score"] == 920000


@pytest.mark.asyncio
async def test_submit_empty_clears_all(authenticated_client: AsyncClient):
    """Submitting empty items list clears all existing items."""
    quest = await _create_quest(authenticated_client)
    quest_id = quest["id"]

    # Submit 1 item
    body1 = {
        "items": [
            {
                "chart_id": quest["charts"][0]["id"],
                "song_name": quest["charts"][0]["song_name"],
                "difficulty": quest["charts"][0]["difficulty"],
                "score": 900000,
                "file_url": "http://example.com/a.jpg",
            },
        ]
    }
    await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body1)

    # Submit empty — should clear
    resp = await authenticated_client.post(
        f"/records/me/quests/{quest_id}/submit", json={"items": []}
    )
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 0


@pytest.mark.asyncio
async def test_get_my_record_includes_items(authenticated_client: AsyncClient):
    quest = await _create_quest(authenticated_client)
    quest_id = quest["id"]

    # Submit two items
    body = {
        "items": [
            {
                "chart_id": quest["charts"][0]["id"],
                "song_name": quest["charts"][0]["song_name"],
                "difficulty": quest["charts"][0]["difficulty"],
                "score": 900000,
                "file_url": "http://example.com/a.jpg",
            },
            {
                "chart_id": quest["charts"][1]["id"],
                "song_name": quest["charts"][1]["song_name"],
                "difficulty": quest["charts"][1]["difficulty"],
                "score": 850000,
                "file_url": "http://example.com/b.jpg",
            },
        ]
    }
    await authenticated_client.post(f"/records/me/quests/{quest_id}/submit", json=body)

    resp = await authenticated_client.get(f"/records/me/quests/{quest_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert all(item["photo"] is not None for item in data["items"])
