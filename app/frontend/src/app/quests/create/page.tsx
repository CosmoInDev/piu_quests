"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/DatePicker";
import { DIFFICULTY_SLOTS } from "@/lib/constants";
import { createQuest, loadRecentUsedKeys } from "@/hooks/useQuest";
import { ApiError } from "@/lib/api";
import { pickUnique } from "@/lib/charts";

interface ChartEntry {
  song_name: string;
  difficulty: string;
}

const emptyCharts = (): ChartEntry[] =>
  DIFFICULTY_SLOTS.map(() => ({ song_name: "", difficulty: "" }));

export default function CreateQuestPage() {
  const router = useRouter();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [charts, setCharts] = useState<ChartEntry[]>(emptyCharts());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 최근 3개 숙제에서 쓰인 (레벨, 곡) 집합. 추첨 시 중복을 피하는 데 쓴다.
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecentUsedKeys()
      .then(setUsedKeys)
      .catch(() => {
        // 조회 실패 시 중복 검사 없이 진행
      });
  }, []);

  const updateChart = (index: number, updates: Partial<ChartEntry>) => {
    setCharts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  const handlePickOne = (index: number) => {
    setError(null);
    try {
      updateChart(index, pickUnique(DIFFICULTY_SLOTS[index].level, usedKeys));
    } catch {
      setError("추첨에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handlePickAll = () => {
    setError(null);
    try {
      setCharts(DIFFICULTY_SLOTS.map((slot) => pickUnique(slot.level, usedKeys)));
    } catch {
      setError("추첨에 실패했습니다. 다시 시도해주세요.");
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
      <h1 className="text-2xl font-bold text-primary mb-6">숙제 만들기</h1>

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

      <Button onClick={handlePickAll} className="mb-4 w-full">
        전부 추첨하기
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
            <Button variant="ghost" size="icon" onClick={() => handlePickOne(i)}>
              <RefreshCw className="h-4 w-4" />
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
