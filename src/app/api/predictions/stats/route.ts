import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPredictions } from "@/lib/sheets";
import type { Choice } from "@/types";

export type PredictionStats = Record<Choice, number>;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const predictions = await getPredictions();
    const stats: Record<string, PredictionStats> = {};

    for (const p of predictions) {
      if (!p.choice) continue;
      if (!stats[p.matchId]) {
        stats[p.matchId] = { HOME: 0, AWAY: 0, DRAW: 0 };
      }
      stats[p.matchId][p.choice] += 1;
    }

    return NextResponse.json({ stats });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tải thống kê" }, { status: 500 });
  }
}
