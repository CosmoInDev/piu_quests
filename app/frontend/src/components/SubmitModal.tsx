"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzePhoto, submitRecord, getMyRecord } from "@/hooks/useRecord";
import type { PhotoAnalysisResult } from "@/types";

interface Chart {
  id: number;
  song_name: string;
  difficulty: string;
  order: number;
}

interface UploadRow {
  id: number;
  file: File | null;
  preview: string | null;
  analyzing: boolean;
  file_url: string | null;
  chart_id: number | null;
  song_name: string;
  difficulty: string;
  score: string;
  error: string | null;
}

interface SubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questId: number;
  charts: Chart[];
  onSubmitted: () => void;
}

let rowIdCounter = 0;

function createEmptyRow(): UploadRow {
  return {
    id: ++rowIdCounter,
    file: null,
    preview: null,
    analyzing: false,
    file_url: null,
    chart_id: null,
    song_name: "",
    difficulty: "",
    score: "",
    error: null,
  };
}

const MAX_ROWS = 8;
const MAX_FILE_SIZE = 30 * 1024 * 1024;

export default function SubmitModal({
  open,
  onOpenChange,
  questId,
  charts,
  onSubmitted,
}: SubmitModalProps) {
  const [rows, setRows] = useState<UploadRow[]>([createEmptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing record on open — convert items to pre-filled rows
  useEffect(() => {
    if (!open) return;
    setValidationError(null);
    setLoading(true);
    getMyRecord(questId)
      .then((record) => {
        const items = record?.items ?? [];
        if (items.length === 0) {
          setRows([createEmptyRow()]);
        } else {
          setRows(
            items.map((item) => ({
              id: ++rowIdCounter,
              file: null,
              preview: item.photo?.file_url ?? null,
              analyzing: false,
              file_url: item.photo?.file_url ?? null,
              chart_id: item.chart_id,
              song_name: item.song_name,
              difficulty: item.difficulty,
              score: item.score.toString(),
              error: null,
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [open, questId]);

  const updateRow = useCallback(
    (rowId: number, updates: Partial<UploadRow>) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r))
      );
    },
    []
  );

  async function handleFileChange(rowId: number, file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      updateRow(rowId, { error: "이미지 파일만 업로드할 수 있습니다." });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      updateRow(rowId, { error: "파일 크기가 30MB를 초과합니다." });
      return;
    }

    const preview = URL.createObjectURL(file);
    updateRow(rowId, {
      file,
      preview,
      analyzing: true,
      error: null,
    });

    try {
      const result: PhotoAnalysisResult = await analyzePhoto(questId, file);
      updateRow(rowId, {
        analyzing: false,
        file_url: result.file_url,
        chart_id: result.matched_chart_id,
        song_name: result.extracted_song_name ?? "",
        difficulty: result.extracted_difficulty ?? "",
        score: result.extracted_score?.toString() ?? "",
      });
    } catch {
      updateRow(rowId, {
        analyzing: false,
        error: "사진 분석에 실패했습니다. 정보를 직접 입력해주세요.",
      });
    }
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return;
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(rowId: number) {
    setRows((prev) => {
      if (prev.length <= 1) {
        return [createEmptyRow()];
      }
      return prev.filter((r) => r.id !== rowId);
    });
  }

  // Validation
  const filledRows = rows.filter(
    (r) => r.file_url && r.chart_id && r.song_name && r.difficulty && r.score
  );
  const anyAnalyzing = rows.some((r) => r.analyzing);

  // Check for duplicate chart selections
  const selectedChartIds = rows
    .filter((r) => r.chart_id !== null)
    .map((r) => r.chart_id!);
  const hasDuplicateCharts =
    new Set(selectedChartIds).size !== selectedChartIds.length;

  const canSubmit =
    filledRows.length > 0 && !anyAnalyzing && !hasDuplicateCharts;

  function validateRows(): string | null {
    const rowsWithFile = rows.filter((r) => r.file_url);
    if (rowsWithFile.length === 0) return "제출할 항목이 없습니다.";

    for (const r of rowsWithFile) {
      if (!r.chart_id) return "곡을 선택해주세요.";
      if (!r.song_name.trim()) return "곡 이름이 비어있습니다.";

      const diff = r.difficulty.trim();
      if (!diff) return "난이도를 입력해주세요.";
      if (!/^[SD]\d{1,2}$/.test(diff))
        return `난이도 형식이 올바르지 않습니다: ${diff} (예: S19, D22)`;

      const scoreNum = parseInt(r.score, 10);
      if (!r.score || isNaN(scoreNum)) return "점수를 입력해주세요.";
      if (scoreNum < 0 || scoreNum > 1000000)
        return "점수는 0~1,000,000 범위여야 합니다.";
    }
    return null;
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    const error = validateRows();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);

    setSubmitting(true);
    try {
      await submitRecord(
        questId,
        filledRows.map((r) => ({
          chart_id: r.chart_id!,
          song_name: r.song_name,
          difficulty: r.difficulty,
          score: parseInt(r.score, 10),
          file_url: r.file_url!,
        }))
      );
      onSubmitted();
      onOpenChange(false);
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>숙제 제출</DialogTitle>
          <DialogDescription>
            결과 사진을 업로드하면 자동으로 정보를 추출합니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <div className="relative h-20 w-20 flex-shrink-0">
                    {row.preview ? (
                      <img
                        src={row.preview}
                        alt="미리보기"
                        className="h-20 w-20 rounded object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded border-2 border-dashed flex items-center justify-center text-muted-foreground text-xs">
                        사진
                      </div>
                    )}
                    {row.analyzing && (
                      <div className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
                        <svg
                          className="h-8 w-8 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(row.id, e.target.files?.[0] ?? null)
                      }
                      className="block w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium"
                    />
                    {row.error && (
                      <p className="text-xs text-destructive">{row.error}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRow(row.id)}
                    className="flex-shrink-0"
                  >
                    삭제
                  </Button>
                </div>

                {/* Fields */}
                {(row.file_url || row.analyzing) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">곡</label>
                      <select
                        value={row.chart_id ?? ""}
                        onChange={(e) => {
                          const chartId = parseInt(e.target.value, 10);
                          const chart = charts.find((c) => c.id === chartId);
                          updateRow(row.id, {
                            chart_id: chartId || null,
                            song_name: chart?.song_name ?? row.song_name,
                            difficulty: chart?.difficulty ?? row.difficulty,
                          });
                        }}
                        disabled={row.analyzing}
                        className="w-full rounded-md border px-2 py-1.5 text-sm bg-background"
                      >
                        <option value="">선택...</option>
                        {charts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.song_name} ({c.difficulty})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        난이도
                      </label>
                      <Input
                        value={row.difficulty}
                        onChange={(e) =>
                          updateRow(row.id, { difficulty: e.target.value })
                        }
                        disabled={row.analyzing}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        점수
                      </label>
                      <Input
                        type="number"
                        value={row.score}
                        onChange={(e) =>
                          updateRow(row.id, { score: e.target.value })
                        }
                        disabled={row.analyzing}
                        min={0}
                        max={1000000}
                        className="h-8"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {hasDuplicateCharts && (
              <p className="text-xs text-destructive">
                같은 곡을 여러 번 선택할 수 없습니다.
              </p>
            )}

            {rows.length < MAX_ROWS && (
              <Button variant="outline" size="sm" onClick={addRow}>
                + 사진 추가
              </Button>
            )}
          </div>
        )}

        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "제출 중..." : "제출"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
