/// <reference types="@cloudflare/workers-types" />
import { Env, QuestRow, rowToQuest, json } from "../../../functions-shared/db";

// GET /api/quests/:id — 단건 조회 (과거 숙제 상세).
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return json({ detail: "잘못된 요청입니다." }, 400);
  }

  const row = await env.DB.prepare("SELECT * FROM quests WHERE id = ?")
    .bind(id)
    .first<QuestRow>();

  if (!row) {
    return json({ detail: "숙제를 찾을 수 없습니다." }, 404);
  }
  return json(rowToQuest(row));
};
