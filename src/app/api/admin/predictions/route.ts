import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPredictions, getMatches } from "@/lib/sheets";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.title !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [predictions, matches] = await Promise.all([
      getPredictions(),
      getMatches(),
    ]);

    const matchMap = new Map(matches.map((m) => [m.matchId, m]));

    const rows = predictions
      .map((p) => {
        const match = matchMap.get(p.matchId);
        return {
          predictionId: p.predictionId,
          userStt: p.userStt,
          userName: p.userName,
          choice: p.choice,
          contribution: p.contribution,
          createdAt: p.createdAt,
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
      .sort((a, b) => {
        const matchSttA = a.match?.stt ?? 0;
        const matchSttB = b.match?.stt ?? 0;
        if (matchSttA !== matchSttB) return matchSttA - matchSttB;
        return a.userStt - b.userStt;
      });

    return NextResponse.json({ rows, total: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tải dữ liệu" }, { status: 500 });
  }
}
