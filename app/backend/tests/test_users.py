import pytest
from httpx import AsyncClient

from app.core.auth import verify_google_token
from app.main import app as fastapi_app

FAKE_PAYLOAD = {
    "sub": "google-id-123",
    "name": "테스터",
    "email": "test@example.com",
}

FAKE_PAYLOAD_2 = {
    "sub": "google-id-456",
    "name": "테스터2",
    "email": "test2@example.com",
}


async def _fake_verify(token: str) -> dict:
    """Return a fake Google payload for testing."""
    if token == "token-2":
        return FAKE_PAYLOAD_2
    return FAKE_PAYLOAD


@pytest.fixture(autouse=True)
def _patch_verify(monkeypatch):
    monkeypatch.setattr("app.core.auth.verify_google_token", _fake_verify)


AUTH = {"Authorization": "Bearer fake-token"}
AUTH_2 = {"Authorization": "Bearer token-2"}


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_get_me_not_registered(client: AsyncClient):
    resp = await client.get("/users/me", headers=AUTH)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "user_not_found"


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post(
        "/users/register", json={"name": "플레이어"}, headers=AUTH
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "플레이어"
    assert data["google_id"] == "google-id-123"


@pytest.mark.asyncio
async def test_register_duplicate_name(client: AsyncClient):
    await client.post("/users/register", json={"name": "플레이어"}, headers=AUTH)
    resp = await client.post(
        "/users/register", json={"name": "플레이어"}, headers=AUTH_2
    )
    assert resp.status_code == 409
    assert resp.json()["detail"] == "name_duplicated"


@pytest.mark.asyncio
async def test_register_already_registered(client: AsyncClient):
    await client.post("/users/register", json={"name": "플레이어"}, headers=AUTH)
    resp = await client.post(
        "/users/register", json={"name": "다른이름"}, headers=AUTH
    )
    assert resp.status_code == 409
    assert resp.json()["detail"] == "already_registered"


@pytest.mark.asyncio
async def test_get_me_success(client: AsyncClient):
    await client.post("/users/register", json={"name": "플레이어"}, headers=AUTH)
    resp = await client.get("/users/me", headers=AUTH)
    assert resp.status_code == 200
    assert resp.json()["name"] == "플레이어"


@pytest.mark.asyncio
async def test_patch_me_success(client: AsyncClient):
    await client.post("/users/register", json={"name": "플레이어"}, headers=AUTH)
    resp = await client.patch(
        "/users/me", json={"name": "새이름"}, headers=AUTH
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "새이름"


@pytest.mark.asyncio
async def test_patch_me_duplicate_name(client: AsyncClient):
    await client.post("/users/register", json={"name": "플레이어"}, headers=AUTH)
    await client.post("/users/register", json={"name": "다른유저"}, headers=AUTH_2)
    resp = await client.patch(
        "/users/me", json={"name": "다른유저"}, headers=AUTH
    )
    assert resp.status_code == 409
    assert resp.json()["detail"] == "name_duplicated"


@pytest.mark.asyncio
async def test_delete_me(client: AsyncClient):
    await client.post("/users/register", json={"name": "플레이어"}, headers=AUTH)
    resp = await client.delete("/users/me", headers=AUTH)
    assert resp.status_code == 204

    resp = await client.get("/users/me", headers=AUTH)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_register_whitespace_name_rejected(client: AsyncClient):
    resp = await client.post(
        "/users/register", json={"name": "   "}, headers=AUTH
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_check_name_available(client: AsyncClient):
    resp = await client.get(
        "/users/check-name", params={"name": "새이름"}, headers=AUTH
    )
    assert resp.status_code == 200
    assert resp.json()["available"] is True


@pytest.mark.asyncio
async def test_check_name_taken(client: AsyncClient):
    await client.post("/users/register", json={"name": "플레이어"}, headers=AUTH)
    resp = await client.get(
        "/users/check-name", params={"name": "플레이어"}, headers=AUTH
    )
    assert resp.status_code == 200
    assert resp.json()["available"] is False
