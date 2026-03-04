import api from "@/lib/api";
import type { Record, PhotoAnalysisResult } from "@/types";

export async function analyzePhoto(
  questId: number,
  file: File
): Promise<PhotoAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<PhotoAnalysisResult>(
    `/photos/analyze?quest_id=${questId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function submitRecord(
  questId: number,
  items: {
    chart_id: number;
    song_name: string;
    difficulty: string;
    score: number;
    file_url: string;
  }[]
): Promise<Record> {
  const res = await api.post<Record>(
    `/records/me/quests/${questId}/submit`,
    { items }
  );
  return res.data;
}

export async function getMyRecord(questId: number): Promise<Record | null> {
  try {
    const res = await api.get<Record>(`/records/me/quests/${questId}`);
    return res.data;
  } catch {
    return null;
  }
}
