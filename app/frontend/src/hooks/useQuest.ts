"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { songKey } from "@/lib/charts";

export interface Chart {
  song_name: string;
  difficulty: string;
  order: number;
}

export interface Quest {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  charts: Chart[];
}

// KST 기준 오늘 'YYYY-MM-DD'.
function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export function useOngoingQuest() {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiGet<Quest | null>("/quests/ongoing")
      .then((data) => {
        if (data) setQuest(data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, []);

  return { quest, loading, notFound };
}

export function usePastQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Quest[]>("/quests")
      .then((data) => {
        const today = todayKST();
        setQuests(data.filter((q) => q.end_date < today));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { quests, loading };
}

export function useQuest(id: number | null) {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id === null) {
      setLoading(false);
      return;
    }
    apiGet<Quest>(`/quests/${id}`)
      .then(setQuest)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return { quest, loading, notFound };
}

// 최근 3개 숙제에서 쓰인 (레벨, 곡) 집합. 추첨 시 중복을 피하는 데 쓴다.
// 전체 숙제는 시작일 내림차순이므로 앞 3개가 최근 3개.
export async function loadRecentUsedKeys(): Promise<Set<string>> {
  const quests = await apiGet<Quest[]>("/quests");
  const keys = new Set<string>();
  for (const q of quests.slice(0, 3)) {
    for (const c of q.charts) {
      const level = c.difficulty.match(/\d+/)?.[0];
      if (level) keys.add(songKey(level, c.song_name));
    }
  }
  return keys;
}

export async function createQuest(data: {
  start_date: string;
  end_date: string;
  charts: Chart[];
}): Promise<Quest> {
  return apiPost<Quest>("/quests", data);
}
