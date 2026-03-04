"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useOngoingQuest, useQuestOverview } from "@/hooks/useQuest";
import { useCurrentUser } from "@/hooks/useUser";
import SubmitModal from "@/components/SubmitModal";
import { Button } from "@/components/ui/button";
import type { ChartOverview, UserSummary } from "@/hooks/useQuest";

export default function OngoingQuestPage() {
  const { quest, loading, notFound } = useOngoingQuest();
  const { data: session } = useSession();
  const { user: currentUser } = useCurrentUser(!!session);
  const { overview, loading: overviewLoading, refetch } = useQuestOverview(
    quest?.id ?? null
  );
  const [expandedChartIds, setExpandedChartIds] = useState<Set<number>>(new Set());
  const [submitOpen, setSubmitOpen] = useState(false);

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

  const chartOverviews = overview?.chart_overviews ?? [];
  const userSummaries = overview?.user_summaries ?? [];

  function getMyScore(chart: ChartOverview): number | null {
    if (!currentUser) return null;
    const sub = chart.submissions.find((s) => s.user_id === currentUser.id);
    return sub?.score ?? null;
  }

  function toggleChart(chartId: number) {
    setExpandedChartIds((prev) => {
      const next = new Set(prev);
      if (next.has(chartId)) {
        next.delete(chartId);
      } else {
        next.add(chartId);
      }
      return next;
    });
  }

  function summaryColor(us: UserSummary): string {
    if (us.total === 0) return "";
    if (us.submitted === us.total) return "text-green-600";
    if (us.submitted === 0) return "text-red-600";
    return "";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-primary">{quest.title}</h1>
        {currentUser && (
          <Button size="sm" onClick={() => setSubmitOpen(true)}>
            제출
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {quest.start_date} ~ {quest.end_date}
      </p>

      {overviewLoading ? (
        <p className="text-muted-foreground">불러오는 중...</p>
      ) : (
        <>
          {/* Chart list */}
          <div className="grid gap-3 mb-8">
            {chartOverviews.map((chart) => {
              const myScore = getMyScore(chart);
              const isExpanded = expandedChartIds.has(chart.chart_id);

              return (
                <div key={chart.chart_id}>
                  <button
                    type="button"
                    onClick={() => toggleChart(chart.chart_id)}
                    className="w-full flex items-center gap-4 rounded-lg border p-4 text-left hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1 text-sm font-semibold min-w-[64px] text-center">
                      {chart.difficulty}
                    </span>
                    <span className="text-base flex-1">{chart.song_name}</span>
                    {myScore !== null && (
                      <span className="text-sm text-muted-foreground font-mono">
                        {myScore.toLocaleString()}
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {/* Expanded: all users' submissions */}
                  {isExpanded && (
                    <div className="border border-t-0 rounded-b-lg px-4 py-3 space-y-1 bg-muted/30">
                      <div className="inline-grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm">
                        {chart.submissions.map((sub) => (
                          <div key={sub.user_id} className="contents">
                            <span>{sub.user_name}</span>
                            <span
                              className={
                                sub.score !== null
                                  ? "font-mono text-right"
                                  : "text-muted-foreground text-right"
                              }
                            >
                              {sub.score !== null
                                ? sub.score.toLocaleString()
                                : "미제출"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User submission summary */}
          {userSummaries.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">제출 현황</h2>
              <div className="inline-grid grid-cols-[auto_auto] gap-x-4 gap-y-2 text-sm rounded-lg border px-4 py-3">
                {userSummaries.map((us) => (
                  <div key={us.user_id} className={`contents ${summaryColor(us)}`}>
                    <span className="font-medium">{us.user_name}</span>
                    <span className="text-right">
                      {us.submitted}/{us.total} 제출
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit modal */}
      {currentUser && (
        <SubmitModal
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          questId={quest.id}
          charts={quest.charts.map((c) => ({
            id: c.id as unknown as number,
            song_name: c.song_name,
            difficulty: c.difficulty,
            order: c.order,
          }))}
          onSubmitted={refetch}
        />
      )}
    </div>
  );
}
