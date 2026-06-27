import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canDrawOnHandicap } from "@/lib/handicap";
import { isVotingOpen } from "@/lib/match";
import {
  getMatchById,
  getPredictionByUserAndMatch,
  createPrediction,
  updatePredictionChoice,
  getUsers,
  getPredictions,
} from "@/lib/sheets";
import { notifyUserPredicted, notifyPredictionProgress } from "@/lib/telegram";
import type { Choice, Match } from "@/types";

async function sendPredictionTelegram(match: Match, userName: string, isNew: boolean) {
  if (isNew) {
    await notifyUserPredicted({
      userName,
      matchStt: match.stt,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
    });
  }

  const [users, predictions] = await Promise.all([getUsers(), getPredictions()]);
  const predictedStts = new Set(
    predictions
      .filter((p) => p.matchId === match.matchId && p.choice)
      .map((p) => p.userStt)
  );
  const notChosen = users
    .filter((u) => !predictedStts.has(u.stt))
    .map((u) => u.fullName);

  await notifyPredictionProgress({
    matchStt: match.stt,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    predictedCount: predictedStts.size,
    totalCount: users.length,
    notChosen,
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { matchId, choice } = await request.json();
    if (!matchId || !choice) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }
    const validChoices: Choice[] = ["HOME", "AWAY", "DRAW"];
    if (!validChoices.includes(choice)) {
      return NextResponse.json({ error: "Lựa chọn không hợp lệ" }, { status: 400 });
    }
    const match = await getMatchById(matchId);
    if (!match) return NextResponse.json({ error: "Không tìm thấy trận" }, { status: 404 });
    if (match.status === "settled") {
      return NextResponse.json({ error: "Trận đã kết thúc" }, { status: 400 });
    }
    if (!isVotingOpen(match)) {
      return NextResponse.json({ error: "Đã hết hạn bình chọn" }, { status: 400 });
    }
    if (choice === "DRAW" && !canDrawOnHandicap(match.handicap)) {
      return NextResponse.json({ error: "Kèo lẻ không cho phép chọn HÒA" }, { status: 400 });
    }
    const existing = await getPredictionByUserAndMatch(session.stt, matchId);
    if (existing) {
      if (existing.choice === choice) {
        return NextResponse.json({ prediction: existing });
      }
      await updatePredictionChoice(existing.predictionId, choice);
      void sendPredictionTelegram(match, session.fullName, false);
      return NextResponse.json({
        prediction: { ...existing, choice },
        updated: true,
      });
    }
    const prediction = await createPrediction({
      matchId,
      userStt: session.stt,
      userName: session.fullName,
      choice,
    });
    void sendPredictionTelegram(match, session.fullName, true);
    return NextResponse.json({ prediction });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi dự đoán" }, { status: 500 });
  }
}
