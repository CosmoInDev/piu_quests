// 로컬 채보 데이터 기반 곡 추첨.
// 데이터는 scripts/update-charts.mjs 가 mentormin.com 에서 긁어 src/data/charts.json 에 저장한다.
import chartData from "../data/charts.json" with { type: "json" };

export type Category = "arcade" | "shortcut" | "remix" | "fullsong";

interface Song {
  name: string;
  category: Category;
  single: number[];
  double: number[];
}

export interface Candidate {
  song_name: string;
  difficulty: string;
}

const SONGS = chartData.songs as Song[];

const ALL_CATEGORIES: Category[] = ["arcade", "shortcut", "remix", "fullsong"];

// 레벨별 추첨 조건(기존 piurank 규칙 그대로).
// - 19 이하: 싱글만 / 아케이드·숏컷만 (리믹스·풀송 제외)
// - 20~25: 싱글·더블 / 전체 종류
// - 26 이상: 더블만 / 전체 종류
function condition(level: number): {
  modes: ("S" | "D")[];
  categories: Category[];
} {
  if (level <= 19) return { modes: ["S"], categories: ["arcade", "shortcut"] };
  if (level >= 26) return { modes: ["D"], categories: ALL_CATEGORIES };
  return { modes: ["S", "D"], categories: ALL_CATEGORIES };
}

// 곡명 표기 차이(공백·괄호·별표·느낌표·마침표·물결·대시)를 무시한 비교용 키.
// 과거 숙제에는 piurank 표기로 저장된 곡명이 남아 있어 로컬 데이터와 표기가 조금씩 다르다.
//   예) "가고일 - FULL SONG" ↔ "가고일 - FULL SONG -"
//       "이 게임은 존재하지 않습니다" ↔ "* 이 게임은 존재하지 않습니다 *"
export function songKey(level: number | string, songName: string): string {
  return `${level}|${songName.toLowerCase().replace(/[\s*()[\]!.~-]/g, "")}`;
}

// 해당 레벨의 추첨 후보 채보 전부.
export function candidatesFor(level: number): Candidate[] {
  const { modes, categories } = condition(level);
  const candidates: Candidate[] = [];
  for (const song of SONGS) {
    if (!categories.includes(song.category)) continue;
    for (const mode of modes) {
      const levels = mode === "S" ? song.single : song.double;
      if (levels.includes(level)) {
        candidates.push({ song_name: song.name, difficulty: `${mode}${level}` });
      }
    }
  }
  return candidates;
}

// 해당 레벨의 후보 채보 중 하나를 뽑는다.
// 최근 숙제에서 쓰인 (레벨, 곡)은 제외하고, 전부 제외되면 어쩔 수 없이 전체에서 뽑는다.
export function pickUnique(level: number, usedKeys: Set<string>): Candidate {
  const pool = candidatesFor(level);
  if (pool.length === 0) throw new Error(`레벨 ${level} 후보 채보가 없습니다.`);
  const fresh = pool.filter((c) => !usedKeys.has(songKey(level, c.song_name)));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}
