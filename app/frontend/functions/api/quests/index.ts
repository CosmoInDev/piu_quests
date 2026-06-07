/// <reference types="@cloudflare/workers-types" />
import {
  Env,
  ChartEntry,
  QuestRow,
  rowToQuest,
  todayKST,
  json,
} from "../../../functions-shared/db";

// GET /api/quests — 전체 숙제 목록 (최신 시작일 순). 과거 숙제 리스트에서 사용.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM quests ORDER BY start_date DESC"
  ).all<QuestRow>();
  return json(results.map(rowToQuest));
};

interface CreateBody {
  start_date?: string;
  end_date?: string;
  charts?: ChartEntry[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// POST /api/quests — 선착순 등록. 진행 중(겹치는) 숙제가 없을 때만 원자적으로 INSERT.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return json({ detail: "잘못된 요청입니다." }, 400);
  }

  const { start_date, end_date, charts } = body;

  // 입력 검증
  if (!start_date || !end_date || !DATE_RE.test(start_date) || !DATE_RE.test(end_date)) {
    return json({ detail: "시작일과 종료일을 올바르게 입력해주세요." }, 400);
  }
  if (start_date > end_date) {
    return json({ detail: "종료일은 시작일 이후여야 합니다." }, 400);
  }
  if (!Array.isArray(charts) || charts.length === 0) {
    return json({ detail: "곡 정보를 입력해주세요." }, 400);
  }
  if (charts.some((c) => !c.song_name?.trim() || !c.difficulty?.trim())) {
    return json({ detail: "모든 곡 정보를 입력해주세요." }, 400);
  }

  // 기간은 오늘을 포함해야 한다.
  const today = todayKST();
  if (start_date > today || end_date < today) {
    return json({ detail: "시작일과 종료일은 오늘 날짜를 포함해야 합니다." }, 400);
  }

  const normalizedCharts: ChartEntry[] = charts.map((c, i) => ({
    song_name: c.song_name.trim(),
    difficulty: c.difficulty.trim(),
    order: typeof c.order === "number" ? c.order : i,
  }));

  // 날짜로 제목 자동 생성: "M/D ~ M/D 숙제"
  const [, sm, sd] = start_date.split("-");
  const [, em, ed] = end_date.split("-");
  const title = `${+sm}/${+sd} ~ ${+em}/${+ed} 숙제`;
  const createdAt = new Date().toISOString();

  // 단일 INSERT ... WHERE NOT EXISTS 로 "겹치는 숙제 없을 때만" 원자적 삽입 → 선착순 경쟁 차단.
  const res = await env.DB.prepare(
    `INSERT INTO quests (title, start_date, end_date, charts, created_at)
     SELECT ?, ?, ?, ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM quests WHERE start_date <= ? AND end_date >= ?
     )`
  )
    .bind(
      title,
      start_date,
      end_date,
      JSON.stringify(normalizedCharts),
      createdAt,
      end_date,
      start_date
    )
    .run();

  if (res.meta.changes === 0) {
    return json({ detail: "해당 기간에 이미 숙제가 존재합니다." }, 409);
  }

  const row = await env.DB.prepare(
    "SELECT * FROM quests WHERE id = ?"
  )
    .bind(res.meta.last_row_id)
    .first<QuestRow>();

  return json(rowToQuest(row!), 201);
};
