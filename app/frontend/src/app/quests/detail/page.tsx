"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuest } from "@/hooks/useQuest";

function QuestDetail() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const id = idParam !== null && /^\d+$/.test(idParam) ? Number(idParam) : null;

  const { quest, loading, notFound } = useQuest(id);

  if (id === null) {
    return <p className="text-muted-foreground">잘못된 접근입니다.</p>;
  }

  if (loading) {
    return <p className="text-muted-foreground">불러오는 중...</p>;
  }

  if (notFound || !quest) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <p className="text-muted-foreground text-lg">숙제를 찾을 수 없습니다.</p>
        <Link
          href="/quests/past"
          className="text-sm text-primary underline hover:opacity-70 transition-opacity"
        >
          지난번 숙제 목록으로
        </Link>
      </div>
    );
  }

  const charts = [...quest.charts].sort((a, b) => a.order - b.order);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2">{quest.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {quest.start_date} ~ {quest.end_date}
      </p>

      <div className="grid gap-3">
        {charts.map((chart, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
            <span className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1 text-sm font-semibold min-w-[64px] text-center">
              {chart.difficulty}
            </span>
            <span className="text-base flex-1">{chart.song_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuestDetailPage() {
  // useSearchParams는 정적 export 시 Suspense 경계가 필요하다.
  return (
    <Suspense fallback={<p className="text-muted-foreground">불러오는 중...</p>}>
      <QuestDetail />
    </Suspense>
  );
}
