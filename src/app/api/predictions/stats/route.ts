import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPredictions, getUsers, getMatches } from "@/lib/sheets";
import { buildVotingStats } from "@/lib/voting-close";
import type { Choice } from "@/types";

export type PredictionStats = Record<Choice, number>;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [predictions, users, matches] = await Promise.all([
      getPredictions(),
      getUsers(),
      getMatches(),
    ]);
    const stats: Record<string, PredictionStats> = {};
    const notChosen: Record<string, string[]> = {};

    for (const p of predictions) {
      if (!p.choice) continue;
      if (!stats[p.matchId]) {
        stats[p.matchId] = { HOME: 0, AWAY: 0, DRAW: 0 };
      }
      stats[p.matchId][p.choice] += 1;
    }

    for (const match of matches) {
      if (match.status !== "open") continue;
      notChosen[match.matchId] = buildVotingStats(match.matchId, predictions, users).notChosen;
    }

    return NextResponse.json({ stats, notChosen });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tải thống kê" }, { status: 500 });
  }
}
