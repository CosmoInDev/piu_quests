import pytest
from datetime import date, timedelta
from httpx import AsyncClient

from app.models.record import Record
from app.models.record_item import RecordItem
from app.models.photo import Photo


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


@pytest.mark.asyncio
async def test_quest_overview_structure(authenticated_client: AsyncClient):
    """Overview returns correct structure with no submissions."""
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
    create_resp = await authenticated_client.post("/quests", json=body)
    quest_id = create_resp.json()["id"]

    resp = await authenticated_client.get(f"/quests/{quest_id}/overview")
    assert resp.status_code == 200
    data = resp.json()

    assert data["quest"]["id"] == quest_id
    assert len(data["chart_overviews"]) == 3
    assert len(data["user_summaries"]) >= 1  # at least the test user

    # All submissions should be None (no photos yet)
    for co in data["chart_overviews"]:
        for sub in co["submissions"]:
            assert sub["score"] is None

    # All user summaries should have 0 submitted
    for us in data["user_summaries"]:
        assert us["submitted"] == 0
        assert us["total"] == 3


@pytest.mark.asyncio
async def test_quest_overview_with_submission(authenticated_client: AsyncClient):
    """Overview shows score after a photo is submitted."""
    from tests.conftest import test_session_factory

    today = date.today()
    charts = [{"song_name": "Song A", "difficulty": "S20", "order": 0}]
    body = {
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=6)).isoformat(),
        "charts": charts,
    }
    create_resp = await authenticated_client.post("/quests", json=body)
    quest_data = create_resp.json()
    quest_id = quest_data["id"]
    chart_id = quest_data["charts"][0]["id"]

    # Create a record + photo directly in DB
    async with test_session_factory() as session:
        # Find the test user
        from sqlalchemy import select
        from app.models.user import User
        user_result = await session.execute(select(User).limit(1))
        user = user_result.scalar_one()

        record = Record(user_id=user.id, quest_id=quest_id)
        session.add(record)
        await session.flush()

        item = RecordItem(
            record_id=record.id,
            chart_id=chart_id,
            song_name="Song A",
            difficulty="S20",
            score=950000,
        )
        session.add(item)
        await session.flush()

        photo = Photo(
            record_item_id=item.id,
            file_url="http://example.com/photo.jpg",
        )
        session.add(photo)
        await session.commit()

    resp = await authenticated_client.get(f"/quests/{quest_id}/overview")
    assert resp.status_code == 200
    data = resp.json()

    # The chart should show the user's submission with score
    chart_overview = data["chart_overviews"][0]
    user_sub = next(s for s in chart_overview["submissions"] if s["score"] is not None)
    assert user_sub["score"] == 950000

    # User summary should show 1/1 submitted
    user_summary = next(us for us in data["user_summaries"] if us["user_id"] == user_sub["user_id"])
    assert user_summary["submitted"] == 1
    assert user_summary["total"] == 1


@pytest.mark.asyncio
async def test_quest_overview_not_found(client: AsyncClient):
    resp = await client.get("/quests/9999/overview")
    assert resp.status_code == 404
