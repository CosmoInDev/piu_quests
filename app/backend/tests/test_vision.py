import pytest
from unittest.mock import patch, MagicMock

from app.services.vision import analyze_game_photo, _extract_json


def test_extract_json_plain():
    text = '{"song_name": "Beethoven Virus", "difficulty": "S19", "score": 950000}'
    result = _extract_json(text)
    assert result["song_name"] == "Beethoven Virus"
    assert result["difficulty"] == "S19"
    assert result["score"] == 950000


def test_extract_json_with_markdown_fences():
    text = '```json\n{"song_name": "Sorceress Elise", "difficulty": "D22", "score": 880000}\n```'
    result = _extract_json(text)
    assert result["song_name"] == "Sorceress Elise"
    assert result["difficulty"] == "D22"
    assert result["score"] == 880000


def test_extract_json_with_bare_fences():
    text = '```\n{"song_name": "Test", "difficulty": "S15", "score": null}\n```'
    result = _extract_json(text)
    assert result["song_name"] == "Test"
    assert result["score"] is None


@pytest.mark.asyncio
async def test_analyze_parses_json():
    mock_response = MagicMock()
    mock_response.text = '{"song_name": "Beethoven Virus", "difficulty": "S19", "score": 950000}'

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("app.services.vision.genai.Client", return_value=mock_client):
        result = await analyze_game_photo(b"fake_image_bytes", "image/jpeg")

    assert result["song_name"] == "Beethoven Virus"
    assert result["difficulty"] == "S19"
    assert result["score"] == 950000


@pytest.mark.asyncio
async def test_analyze_handles_null_fields():
    mock_response = MagicMock()
    mock_response.text = '{"song_name": null, "difficulty": null, "score": null}'

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("app.services.vision.genai.Client", return_value=mock_client):
        result = await analyze_game_photo(b"fake_image_bytes", "image/jpeg")

    assert result["song_name"] is None
    assert result["difficulty"] is None
    assert result["score"] is None


@pytest.mark.asyncio
async def test_analyze_handles_exception():
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("API error")

    with patch("app.services.vision.genai.Client", return_value=mock_client):
        result = await analyze_game_photo(b"fake_image_bytes", "image/jpeg")

    assert result["song_name"] is None
    assert result["difficulty"] is None
    assert result["score"] is None
