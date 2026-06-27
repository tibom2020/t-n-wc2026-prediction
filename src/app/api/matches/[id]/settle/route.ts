import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { calcHandicapResult, calcContribution, MISSING_PREDICTION_CONTRIBUTION } from "@/lib/handicap";
import {
  getMatchById,
  settleMatch,
  getPredictions,
  getUsers,
  updatePredictionContribution,
  createMissedPrediction,
} from "@/lib/sheets";
import { notifyMatchSettled } from "@/lib/telegram";
import type { Choice } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.title !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const { homeScore, awayScore } = await request.json();
    if (homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: "Thiếu tỉ số" }, { status: 400 });
    }
    const match = await getMatchById(id);
    if (!match) return NextResponse.json({ error: "Không tìm thấy trận" }, { status: 404 });
    if (match.status === "settled") {
      return NextResponse.json({ error: "Trận đã kết thúc" }, { status: 400 });
    }
    const hScore = Number(homeScore);
    const aScore = Number(awayScore);
    const handicapResult = calcHandicapResult(hScore, aScore, match.handicap);
    await settleMatch(id, hScore, aScore, handicapResult);
    const [predictions, users] = await Promise.all([getPredictions(), getUsers()]);
    const matchPredictions = predictions.filter((p) => p.matchId === id);
    const predictedUserStts = new Set(matchPredictions.map((p) => p.userStt));
    const contributions: Array<{
      userName: string;
      choice: Choice | null;
      contribution: number;
    }> = [];

    for (const p of matchPredictions) {
      if (!p.choice) continue;
      const contribution = calcContribution(p.choice, handicapResult);
      await updatePredictionContribution(p.predictionId, contribution);
      contributions.push({
        userName: p.userName,
        choice: p.choice,
        contribution,
      });
    }

    let missedCount = 0;
    for (const user of users) {
      if (predictedUserStts.has(user.stt)) continue;
      await createMissedPrediction({
        matchId: id,
        userStt: user.stt,
        userName: user.fullName,
        contribution: MISSING_PREDICTION_CONTRIBUTION,
      });
      contributions.push({
        userName: user.fullName,
        choice: null,
        contribution: MISSING_PREDICTION_CONTRIBUTION,
      });
      missedCount += 1;
    }

    await notifyMatchSettled({
      matchStt: match.stt,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      handicap: match.handicap,
      homeScore: hScore,
      awayScore: aScore,
      handicapResult,
      contributions,
    });

    return NextResponse.json({
      handicapResult,
      settled: matchPredictions.length,
      missed: missedCount,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi settle" }, { status: 500 });
  }
}
