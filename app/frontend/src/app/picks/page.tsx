"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIFFICULTY_SLOTS } from "@/lib/constants";
import { pickUnique } from "@/lib/charts";
import { loadRecentUsedKeys } from "@/hooks/useQuest";

interface ChartEntry {
  song_name: string;
  difficulty: string;
}

const emptyCharts = (): ChartEntry[] =>
  DIFFICULTY_SLOTS.map(() => ({ song_name: "", difficulty: "" }));

// 숙제 등록과 무관하게 추첨 결과만 미리 확인해 보는 테스트 페이지.
export default function SamplePickPage() {
  const [charts, setCharts] = useState<ChartEntry[]>(emptyCharts());
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">추첨 테스트</h1>

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
    </div>
  );
}
