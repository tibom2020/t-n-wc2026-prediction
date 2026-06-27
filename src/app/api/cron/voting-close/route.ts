import { NextResponse } from "next/server";
import {
  getMatches,
  getPredictions,
  getUsers,
  closeMatchVoting,
} from "@/lib/sheets";
import { notifyVotingClosed } from "@/lib/telegram";
import type { Choice } from "@/types";

function isKickoffPassed(kickoff: string): boolean {
  if (!kickoff) return false;
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() >= date.getTime();
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [matches, predictions, users] = await Promise.all([
      getMatches(),
      getPredictions(),
      getUsers(),
    ]);

    const due = matches.filter(
      (m) =>
        m.status === "open" &&
        !m.votingClosedNotified &&
        isKickoffPassed(m.kickoff)
    );

    for (const match of due) {
      const matchPredictions = predictions.filter(
        (p) => p.matchId === match.matchId && p.choice
      );
      const predictedUserStts = new Set(matchPredictions.map((p) => p.userStt));

      const stats: Record<Choice, string[]> = {
        HOME: [],
        AWAY: [],
        DRAW: [],
      };
      for (const p of matchPredictions) {
        if (p.choice) stats[p.choice].push(p.userName);
      }

      const notChosen = users
        .filter((u) => !predictedUserStts.has(u.stt))
        .map((u) => u.fullName);

      await notifyVotingClosed({
        matchStt: match.stt,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        handicap: match.handicap,
        stats,
        notChosen,
      });

      await closeMatchVoting(match.matchId);
    }

    return NextResponse.json({ processed: due.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
