"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIFFICULTY_SLOTS } from "@/lib/constants";
import { SLOT_GAP_MS, loadRecentUsedKeys, pickUnique, sleep } from "@/lib/pick";

interface ChartEntry {
  song_name: string;
  difficulty: string;
}

const emptyCharts = (): ChartEntry[] =>
  DIFFICULTY_SLOTS.map(() => ({ song_name: "", difficulty: "" }));

// 숙제 등록과 무관하게 추첨 결과만 미리 확인해 보는 테스트 페이지.
export default function SamplePickPage() {
  const [charts, setCharts] = useState<ChartEntry[]>(emptyCharts());
  const [picking, setPicking] = useState(false);
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-2">추첨 테스트</h1>
      <p className="text-sm text-muted-foreground mb-6">
        추첨을 너무 자주 돌리면 WINDFORCE 선생님의 서버가 튕겨내서 실패할 수
        있습니다. 살살 돌려 주세요!
      </p>

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
    </div>
  );
}
