import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPredictionsByUser, getMatches } from "@/lib/sheets";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const [predictions, matches] = await Promise.all([
      getPredictionsByUser(session.stt),
      getMatches(),
    ]);
    const matchMap = new Map(matches.map((m) => [m.matchId, m]));
    const history = predictions
      .map((p) => {
        const match = matchMap.get(p.matchId);
        return {
          ...p,
          match: match
            ? {
                stt: match.stt,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                handicap: match.handicap,
                kickoff: match.kickoff,
                status: match.status,
                handicapResult: match.handicapResult,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
              }
            : null,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const totalContribution = history.reduce((sum, h) => sum + (h.contribution ?? 0), 0);
    return NextResponse.json({ history, totalContribution });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tải lịch sử" }, { status: 500 });
  }
}
