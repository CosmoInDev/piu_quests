"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

interface Chart {
  id: number;
  quest_id: number;
  song_name: string;
  difficulty: string;
  order: number;
}

interface Quest {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  charts: Chart[];
}

export function useOngoingQuest() {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get("/quests/ongoing")
      .then((res) => {
        if (res.data === null) {
          setNotFound(true);
        } else {
          setQuest(res.data);
        }
      })
      .catch(() => {
        // Unexpected error — treat as not found
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return { quest, loading, notFound };
}

export interface ChartSubmission {
  user_id: number;
  user_name: string;
  score: number | null;
  photo_url: string | null;
}

export interface ChartOverview {
  chart_id: number;
  song_name: string;
  difficulty: string;
  order: number;
  submissions: ChartSubmission[];
}

export interface UserSummary {
  user_id: number;
  user_name: string;
  submitted: number;
  total: number;
}

export interface QuestOverview {
  quest: Quest;
  chart_overviews: ChartOverview[];
  user_summaries: UserSummary[];
}

export function useQuestOverview(questId: number | null) {
  const [overview, setOverview] = useState<QuestOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    if (questId === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`/quests/${questId}/overview`)
      .then((res) => setOverview(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [questId, trigger]);

  return { overview, loading, refetch };
}

export async function createQuest(data: {
  start_date: string;
  end_date: string;
  charts: { song_name: string; difficulty: string; order: number }[];
}) {
  const res = await api.post("/quests", data);
  return res.data as Quest;
}

export async function pickChart(
  level: number,
  mode?: "single" | "double"
): Promise<{ song_name: string; difficulty: string }> {
  const res = await api.post("/quests/pick", { level, mode });
  return res.data;
}
