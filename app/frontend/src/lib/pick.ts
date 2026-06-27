import { apiGet } from "@/lib/api";
import { pickChart, type Quest } from "@/hooks/useQuest";

// 슬롯/재시도 사이 텀(ms). 동시에 여러 요청을 보내면 piurank가 403을 내므로 간격을 둔다.
export const SLOT_GAP_MS = 500;
// 추첨 실패·중복 시 한 슬롯당 최대 시도 횟수.
export const MAX_ATTEMPTS = 5;

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// difficulty 문자열("S20"/"D26")에서 레벨 숫자만 추출.
function levelOf(difficulty: string): string | null {
  return difficulty.match(/\d+/)?.[0] ?? null;
}

// 최근 3개 숙제에서 쓰인 (레벨, 곡) 집합. 추첨 시 중복을 피하는 데 쓴다.
// 전체 숙제는 시작일 내림차순이므로 앞 3개가 최근 3개.
export async function loadRecentUsedKeys(): Promise<Set<string>> {
  const quests = await apiGet<Quest[]>("/quests");
  const keys = new Set<string>();
  for (const q of quests.slice(0, 3)) {
    for (const c of q.charts) {
      const level = levelOf(c.difficulty);
      if (level) keys.add(`${level}|${c.song_name.trim()}`);
    }
  }
  return keys;
}

// 추첨 요청이 실패하거나, 최근 숙제와 (레벨, 곡)이 중복되면 재추첨한다.
// 최대 MAX_ATTEMPTS 회 시도하며,
//  - 끝까지 요청이 실패하면 throw 하여 기존처럼 에러로 처리하고,
//  - 성공은 했지만 계속 중복만 나오면 마지막 결과를 그대로 채택한다.
export async function pickUnique(
  level: number,
  usedKeys: Set<string>
): Promise<{ song_name: string; difficulty: string }> {
  let lastResult: { song_name: string; difficulty: string } | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(SLOT_GAP_MS);
    try {
      const result = await pickChart(level);
      lastResult = result;
      if (!usedKeys.has(`${level}|${result.song_name.trim()}`)) return result;
    } catch (err) {
      lastError = err;
    }
  }
  if (lastResult) return lastResult;
  throw lastError;
}
