"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useOngoingQuest } from "@/hooks/useQuest";

export default function OngoingQuestPage() {
  const { quest, loading, notFound } = useOngoingQuest();
  const { data: session } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-lg">불러오는 중...</p>
      </div>
    );
  }

  if (notFound || !quest) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <p className="text-muted-foreground text-lg">
          현재 진행 중인 숙제가 없습니다. 숙제를 등록해주세요.
        </p>
        {session && (
          <Link
            href="/quests/create"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            숙제 만들기
          </Link>
        )}
      </div>
    );
  }

  const sortedCharts = [...quest.charts].sort((a, b) => a.order - b.order);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2">{quest.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {quest.start_date} ~ {quest.end_date}
      </p>
      <div className="grid gap-3">
        {sortedCharts.map((chart) => (
          <div
            key={chart.id}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <span className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1 text-sm font-semibold min-w-[64px] text-center">
              {chart.difficulty}
            </span>
            <span className="text-base">{chart.song_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
