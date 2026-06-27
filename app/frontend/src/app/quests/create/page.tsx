"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/DatePicker";
import { DIFFICULTY_SLOTS } from "@/lib/constants";
import { createQuest, pickChart, type Quest } from "@/hooks/useQuest";
import { apiGet, ApiError } from "@/lib/api";

interface ChartEntry {
  song_name: string;
  difficulty: string;
}

const emptyCharts = (): ChartEntry[] =>
  DIFFICULTY_SLOTS.map(() => ({ song_name: "", difficulty: "" }));

// 슬롯/재시도 사이 텀(ms). 동시에 여러 요청을 보내면 piurank가 403을 내므로 간격을 둔다.
const SLOT_GAP_MS = 500;
// 추첨 실패·중복 시 한 슬롯당 최대 시도 횟수.
const MAX_ATTEMPTS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 추첨 요청이 실패하거나, 최근 숙제와 (레벨, 곡)이 중복되면 재추첨한다.
// 최대 MAX_ATTEMPTS 회 시도하며,
//  - 끝까지 요청이 실패하면 throw 하여 기존처럼 에러로 처리하고,
//  - 성공은 했지만 계속 중복만 나오면 마지막 결과를 그대로 채택한다.
async function pickUnique(
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

// difficulty 문자열("S20"/"D26")에서 레벨 숫자만 추출.
function levelOf(difficulty: string): string | null {
  return difficulty.match(/\d+/)?.[0] ?? null;
}

export default function CreateQuestPage() {
  const router = useRouter();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [charts, setCharts] = useState<ChartEntry[]>(emptyCharts());
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 최근 3개 숙제에서 쓰인 (레벨, 곡) 집합. 추첨 시 중복을 피하는 데 쓴다.
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 전체 숙제는 시작일 내림차순이므로 앞 3개가 최근 3개.
    apiGet<Quest[]>("/quests")
      .then((quests) => {
        const keys = new Set<string>();
        for (const q of quests.slice(0, 3)) {
          for (const c of q.charts) {
            const level = levelOf(c.difficulty);
            if (level) keys.add(`${level}|${c.song_name.trim()}`);
          }
        }
        setUsedKeys(keys);
      })
      .catch(() => {
        // 조회 실패 시 중복 검사 없이 진행
      });
  }, []);

  const updateChart = (index: number, updates: Partial<ChartEntry>) => {
    setCharts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  const handlePickOne = async (index: number) => {
    const slot = DIFFICULTY_SLOTS[index];
    setPickingIndex(index);
    setError(null);
    try {
      const result = await pickUnique(slot.level, usedKeys);
      updateChart(index, {
        song_name: result.song_name,
        difficulty: result.difficulty,
      });
    } catch {
      setError("추첨에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setPickingIndex(null);
    }
  };

  const handlePickAll = async () => {
    setPicking(true);
    setError(null);
    try {
      // 동시 요청 대신 슬롯마다 0.5초 텀을 두고 순차 추첨한다(403 회피).
      for (let i = 0; i < DIFFICULTY_SLOTS.length; i++) {
        if (i > 0) await sleep(SLOT_GAP_MS);
        setPickingIndex(i);
        const result = await pickUnique(DIFFICULTY_SLOTS[i].level, usedKeys);
        updateChart(i, {
          song_name: result.song_name,
          difficulty: result.difficulty,
        });
      }
    } catch {
      setError("추첨에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setPicking(false);
      setPickingIndex(null);
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      setError("시작일과 종료일을 선택해주세요.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (start > today || end < today) {
      setError("시작일과 종료일은 오늘 날짜를 포함해야 합니다.");
      return;
    }
    const allFilled = charts.every(
      (c) => c.song_name.trim() && c.difficulty.trim()
    );
    if (!allFilled) {
      setError("모든 곡 정보를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createQuest({
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        charts: charts.map((c, i) => ({
          song_name: c.song_name,
          difficulty: c.difficulty,
          order: i,
        })),
      });
      router.push("/quests/ongoing");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // 선착순 충돌(409) 등 서버가 내려준 메시지를 그대로 노출
        setError(err.message);
      } else {
        setError("숙제 등록에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-2">숙제 만들기</h1>
      <p className="text-sm text-muted-foreground mb-6">
        추첨을 너무 자주 돌리면 WINDFORCE 선생님의 서버가 튕겨내서 실패할 수
        있습니다. 살살 돌려 주세요!
      </p>

      {/* 기간 선택 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <DatePicker
          value={startDate}
          onChange={setStartDate}
          placeholder="시작일"
        />
        <span className="text-muted-foreground">~</span>
        <DatePicker
          value={endDate}
          onChange={setEndDate}
          placeholder="종료일"
        />
      </div>

      <Button
        onClick={handlePickAll}
        disabled={picking}
        className="mb-4 w-full"
      >
        {picking ? "추첨 중..." : "전부 추첨하기"}
      </Button>

      <div className="grid gap-3">
        {DIFFICULTY_SLOTS.map((slot, i) => (
          <div
            key={slot.label}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <span className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1 text-sm font-semibold min-w-[80px] text-center">
              {slot.label}
            </span>
            <Input
              value={charts[i].difficulty}
              disabled
              className="w-[80px]"
              placeholder="난이도"
            />
            <Input
              value={charts[i].song_name}
              disabled
              className="flex-1"
              placeholder="곡명"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePickOne(i)}
              disabled={pickingIndex === i || picking}
            >
              <RefreshCw
                className={`h-4 w-4 ${pickingIndex === i ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-destructive text-sm mt-4">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full"
        size="lg"
      >
        {submitting ? "등록 중..." : "등록하기"}
      </Button>
    </div>
  );
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
