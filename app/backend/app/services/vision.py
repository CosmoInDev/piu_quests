import asyncio
import json
import re

from google import genai
from google.genai import types

from app.core.config import settings

PROMPT = """이 사진은 Pump It Up 리듬 게임의 결과 화면입니다.
다음 정보를 추출해주세요:

1. **song_name**: 화면 상단의 파란색 배경 영역에 있는 곡 이름
2. **difficulty**: 빨간색(S) 또는 초록색(D) 타원 안의 모드 문자와 레벨 숫자 (예: S19, D22)
3. **score**: "SCORE" 텍스트 아래에 있는 점수 (0~1000000 범위)

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{"song_name": "곡이름", "difficulty": "S19", "score": 950000}

정보를 확인할 수 없는 경우 해당 필드를 null로 설정해주세요."""


def _extract_json(text: str) -> dict:
    """Extract JSON from response, stripping markdown code fences if present."""
    text = text.strip()
    # Remove markdown code fences
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


def _call_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """Synchronous Gemini API call."""
    client = genai.Client(api_key=settings.gemini_api_key)

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            types.Part.from_text(text=PROMPT),
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
    )
    return _extract_json(response.text)


async def analyze_game_photo(image_bytes: bytes, mime_type: str) -> dict:
    """Analyze a PIU game result photo and extract song_name, difficulty, score.

    Returns dict with keys: song_name, difficulty, score (any may be None).
    """
    try:
        result = await asyncio.to_thread(_call_gemini, image_bytes, mime_type)
    except Exception:
        result = {"song_name": None, "difficulty": None, "score": None}

    # Normalize: ensure all expected keys exist
    return {
        "song_name": result.get("song_name"),
        "difficulty": result.get("difficulty"),
        "score": result.get("score"),
    }
