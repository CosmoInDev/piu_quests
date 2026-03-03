"use client";

import { useEffect, useState } from "react";
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
