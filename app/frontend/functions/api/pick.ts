/// <reference types="@cloudflare/workers-types" />
import { json } from "../../functions-shared/db";

const PIURANK_DRAW_URL = "https://piurank.com/playinfo/draw_result";

interface PickBody {
  level?: number;
}

// 레벨별 추첨 조건(piurank 규칙).
// - 19: Single / Arcade, Short
// - 20~25: Single & Double / 전체 타입
// - 26: Double / 전체 타입
function drawCondition(level: number): { modes: string[]; types: string[] } {
  const allTypes = ["Arcade", "Remix", "Full", "Short"];
  if (level <= 19) return { modes: ["Single"], types: ["Arcade", "Short"] };
  if (level >= 26) return { modes: ["Double"], types: allTypes };
  return { modes: ["Single", "Double"], types: allTypes };
}

// piurank 결과 HTML에서 곡명·난이도 추출.
// 곡 셀 패턴: "{작곡가} - {곡명} {S|D}{level}"
//   예) "도인 - 솔브 마이 허트 - SHORT CUT - S20"
//       → song_name = "솔브 마이 허트 - SHORT CUT -", difficulty = "S20"
// 첫 " - " 까지는 작곡가, 끝의 "{S|D}{level}" 는 난이도, 그 사이가 곡명.
function parseResult(
  html: string
): { song_name: string; difficulty: string } | null {
  const cell = html.match(/text-dark">([^<]+)<\/div>/);
  if (!cell) return null;
  const text = cell[1].trim();
  const m = text.match(/^.+? - (.+) +([SD]\d+)$/);
  if (!m) return null;
  return { song_name: m[1].trim(), difficulty: m[2] };
}

// POST /api/pick — piurank.com 곡 추첨 프록시 (CORS 회피).
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

  const { modes, types } = drawCondition(body.level);
  const url = new URL(PIURANK_DRAW_URL);
  url.searchParams.set("min", String(body.level));
  url.searchParams.set("max", String(body.level));
  for (const mode of modes) url.searchParams.append("mode[]", mode);
  for (const type of types) url.searchParams.append("type[]", type);
  url.searchParams.set("count", "1");

  let resp: Response;
  try {
    resp = await fetch(url.toString());
  } catch {
    return json({ detail: "추첨 서버에 연결하지 못했습니다." }, 502);
  }

  if (!resp.ok) {
    return json({ detail: "추첨에 실패했습니다." }, 502);
  }

  const result = parseResult(await resp.text());
  if (!result) {
    return json({ detail: "조건에 맞는 곡이 없습니다." }, 502);
  }

  return json(result);
};
