/// <reference types="@cloudflare/workers-types" />
// Pages Functions 공유 헬퍼. functions/ 밖에 두어 라우트로 잡히지 않게 한다.

export interface Env {
  DB: D1Database;
}

export interface ChartEntry {
  song_name: string;
  difficulty: string;
  order: number;
}

export interface QuestOut {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  charts: ChartEntry[];
}

interface QuestRow {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  charts: string;
  created_at: string;
}

// D1 행을 프론트가 기대하는 형태로 변환 (charts JSON 파싱 + order 정렬).
export function rowToQuest(row: QuestRow): QuestOut {
  let charts: ChartEntry[] = [];
  try {
    charts = JSON.parse(row.charts) as ChartEntry[];
  } catch {
    charts = [];
  }
  charts.sort((a, b) => a.order - b.order);
  return {
    id: row.id,
    title: row.title,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    charts,
  };
}

export type { QuestRow };

// KST 기준 오늘 날짜 'YYYY-MM-DD'.
export function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
