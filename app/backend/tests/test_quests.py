import pytest
from datetime import date, timedelta
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_quests_empty(client: AsyncClient):
    response = await client.get("/quests")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_ongoing_quest_returns_null_when_empty(client: AsyncClient):
    response = await client.get("/quests/ongoing")
    assert response.status_code == 200
    assert response.json() is None


@pytest.mark.asyncio
async def test_ongoing_quest_returns_quest(authenticated_client: AsyncClient):
    today = date.today()
    charts = [
        {"song_name": "Test Song", "difficulty": "S19", "order": i}
        for i in range(8)
    ]
    body = {
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=6)).isoformat(),
        "charts": charts,
    }
    create_resp = await authenticated_client.post("/quests", json=body)
    assert create_resp.status_code == 201

    response = await authenticated_client.get("/quests/ongoing")
    assert response.status_code == 200
    data = response.json()
    assert len(data["charts"]) == 8
    assert "숙제" in data["title"]


@pytest.mark.asyncio
async def test_create_quest_with_charts(authenticated_client: AsyncClient):
    today = date.today()
    charts = [
        {"song_name": f"Song {i}", "difficulty": f"S{19 + i}", "order": i}
        for i in range(8)
    ]
    body = {
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=6)).isoformat(),
        "charts": charts,
    }
    response = await authenticated_client.post("/quests", json=body)
    assert response.status_code == 201
    data = response.json()
    assert len(data["charts"]) == 8
    assert data["charts"][0]["song_name"] == "Song 0"
    expected_title = f"{today.month}/{today.day} ~ {(today + timedelta(days=6)).month}/{(today + timedelta(days=6)).day} 숙제"
    assert data["title"] == expected_title


@pytest.mark.asyncio
async def test_create_quest_rejects_dates_not_including_today(authenticated_client: AsyncClient):
    future_start = date.today() + timedelta(days=7)
    charts = [{"song_name": "Song", "difficulty": "S19", "order": 0}]
    body = {
        "start_date": future_start.isoformat(),
        "end_date": (future_start + timedelta(days=6)).isoformat(),
        "charts": charts,
    }
    resp = await authenticated_client.post("/quests", json=body)
    assert resp.status_code == 400

    past_end = date.today() - timedelta(days=1)
    body2 = {
        "start_date": (past_end - timedelta(days=6)).isoformat(),
        "end_date": past_end.isoformat(),
        "charts": charts,
    }
    resp2 = await authenticated_client.post("/quests", json=body2)
    assert resp2.status_code == 400


@pytest.mark.asyncio
async def test_create_quest_rejects_overlap(authenticated_client: AsyncClient):
    today = date.today()
    charts = [{"song_name": "Song", "difficulty": "S19", "order": 0}]
    body = {
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=6)).isoformat(),
        "charts": charts,
    }
    resp1 = await authenticated_client.post("/quests", json=body)
    assert resp1.status_code == 201

    # Overlapping date range (still includes today)
    body2 = {
        "start_date": (today - timedelta(days=1)).isoformat(),
        "end_date": (today + timedelta(days=10)).isoformat(),
        "charts": charts,
    }
    resp2 = await authenticated_client.post("/quests", json=body2)
    assert resp2.status_code == 409
