/// <reference types="@cloudflare/workers-types" />
import { json } from "../../functions-shared/db";

const PIURISE_SONG_SELECT_URL = "https://piurise.com/api/arcade/song-select";

interface PickBody {
  level?: number;
  mode?: "single" | "double";
}

// POST /api/pick — piurise.com 곡 추첨 프록시 (CORS·키 노출 회피).
export const onRequestPost: PagesFunction = async ({ request }) => {
  let body: PickBody;
  try {
    body = await request.json();
  } catch {
    return json({ detail: "잘못된 요청입니다." }, 400);
  }

  if (typeof body.level !== "number") {
    return json({ detail: "레벨을 입력해주세요." }, 400);
  }

  const requestBody: Record<string, unknown> = {
    minLevel: body.level,
    maxLevel: body.level,
    pickCount: 1,
    excludeSongIds: [],
  };
  if (body.mode) {
    requestBody.mode = body.mode;
  }

  let resp: Response;
  try {
    resp = await fetch(PIURISE_SONG_SELECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch {
    return json({ detail: "추첨 서버에 연결하지 못했습니다." }, 502);
  }

  if (!resp.ok) {
    return json({ detail: "추첨에 실패했습니다." }, 502);
  }

  const data = (await resp.json()) as { songs?: Array<Record<string, unknown>> };
  const songs = data.songs ?? [];
  if (songs.length === 0) {
    return json({ detail: "조건에 맞는 곡이 없습니다." }, 502);
  }

  const song = songs[0];
  const songName = song.songTitle as string;
  // difficultyBgUrl 의 접미사로 Single/Double 구분.
  const bgUrl = (song.difficultyBgUrl as string) ?? "";
  const modeLetter = bgUrl.endsWith("d_bg.png") ? "D" : "S";
  const difficulty = `${modeLetter}${song.stepLevel}`;

  return json({ song_name: songName, difficulty });
};
