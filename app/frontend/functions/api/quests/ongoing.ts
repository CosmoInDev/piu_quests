/// <reference types="@cloudflare/workers-types" />
import { Env, QuestRow, rowToQuest, todayKST, json } from "../../../functions-shared/db";

// GET /api/quests/ongoing — 오늘을 포함하는 숙제 1개 (없으면 null).
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = todayKST();
  const row = await env.DB.prepare(
    "SELECT * FROM quests WHERE start_date <= ? AND end_date >= ? LIMIT 1"
  )
    .bind(today, today)
    .first<QuestRow>();

  return json(row ? rowToQuest(row) : null);
};
