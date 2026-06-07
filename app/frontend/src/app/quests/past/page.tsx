"use client";

import Link from "next/link";
import { usePastQuests } from "@/hooks/useQuest";

export default function PastQuestsPage() {
  const { quests, loading } = usePastQuests();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">지난번 숙제</h1>

      {loading ? (
        <p className="text-muted-foreground">불러오는 중...</p>
      ) : quests.length === 0 ? (
        <p className="text-muted-foreground">지난 숙제 기록이 없습니다.</p>
      ) : (
        <div className="grid gap-3">
          {quests.map((quest) => (
            <Link
              key={quest.id}
              href={`/quests/detail?id=${quest.id}`}
              className="flex flex-col rounded-lg border p-4 hover:bg-accent/50 transition-colors"
            >
              <span className="text-base font-semibold">{quest.title}</span>
              <span className="text-sm text-muted-foreground mt-1">
                {quest.start_date} ~ {quest.end_date}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
