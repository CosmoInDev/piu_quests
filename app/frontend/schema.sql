-- D1(SQLite) 스키마. charts는 소량이고 항상 quest와 함께 쓰여 JSON 컬럼으로 단순화.
-- 적용: wrangler d1 execute piu-quests --file=./schema.sql  (로컬은 --local 추가)
CREATE TABLE IF NOT EXISTS quests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  start_date TEXT NOT NULL,            -- 'YYYY-MM-DD' (KST 기준)
  end_date   TEXT NOT NULL,            -- 'YYYY-MM-DD'
  charts     TEXT NOT NULL,            -- JSON 배열: [{ "song_name", "difficulty", "order" }]
  created_at TEXT NOT NULL             -- ISO8601
);

-- 목록/현재 숙제 조회가 날짜 기준이라 인덱스 추가.
CREATE INDEX IF NOT EXISTS idx_quests_dates ON quests (start_date, end_date);
