"use client";

import { useState } from "react";
import Link from "next/link";
import { Clipboard } from "lucide-react";
import { useOngoingQuest } from "@/hooks/useQuest";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OngoingQuestPage() {
  const { quest, loading, notFound } = useOngoingQuest();
  const [copyModalOpen, setCopyModalOpen] = useState(false);

  function handleCopy() {
    if (!quest) return;
    const [, mm, dd] = quest.end_date.split("-");
    const header = `숙제 지정곡(~${mm}/${dd})`;
    const lines = [...quest.charts]
      .sort((a, b) => a.order - b.order)
      .map((c) => `${c.song_name} ${c.difficulty}`);
    navigator.clipboard.writeText([header, ...lines].join("\n"));
    setCopyModalOpen(true);
  }

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
        <Link
          href="/quests/create"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          숙제 만들기
        </Link>
      </div>
    );
  }

  const charts = [...quest.charts].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold text-primary">{quest.title}</h1>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="지정곡 목록 복사"
        >
          <Clipboard size={18} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {quest.start_date} ~ {quest.end_date}
      </p>

      <div className="grid gap-3">
        {charts.map((chart, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <span className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1 text-sm font-semibold min-w-[64px] text-center">
              {chart.difficulty}
            </span>
            <span className="text-base flex-1">{chart.song_name}</span>
          </div>
        ))}
      </div>

      {/* 복사 완료 안내 */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>복사 완료</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">클립보드에 복사되었습니다.</p>
          <DialogFooter>
            <Button onClick={() => setCopyModalOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
