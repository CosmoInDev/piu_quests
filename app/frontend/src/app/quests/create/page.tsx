"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/DatePicker";
import { DIFFICULTY_SLOTS } from "@/lib/constants";
import { createQuest, pickChart } from "@/hooks/useQuest";
import { ApiError } from "@/lib/api";

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
  const [picking, setPicking] = useState(false);
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateChart = (index: number, updates: Partial<ChartEntry>) => {
    setCharts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  const handlePickOne = async (index: number) => {
    const slot = DIFFICULTY_SLOTS[index];
    setPickingIndex(index);
    try {
      const result = await pickChart(slot.level);
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
      const results = await Promise.all(
        DIFFICULTY_SLOTS.map((slot) => pickChart(slot.level))
      );
      setCharts(
        results.map((r) => ({
          song_name: r.song_name,
          difficulty: r.difficulty,
        }))
      );
    } catch {
      setError("추첨에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setPicking(false);
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
