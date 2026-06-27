import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { parseDatetimeLocalAsGMT7 } from "@/lib/datetime";
import { parseHandicap } from "@/lib/utils";
import { getMatches, createMatch, updateMatchStatus } from "@/lib/sheets";
import { notifyMatchCreated } from "@/lib/telegram";

export async function GET() {
  try {
    const matches = await getMatches();
    return NextResponse.json({ matches });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tải trận đấu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.title !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { homeTeam, awayTeam, handicap, kickoff } = await request.json();
    if (!homeTeam || !awayTeam || handicap === undefined || !kickoff) {
      return NextResponse.json({ error: "Thiếu thông tin trận đấu" }, { status: 400 });
    }
    const kickoffIso = parseDatetimeLocalAsGMT7(kickoff);
    if (new Date(kickoffIso).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Giờ đá phải ở tương lai" }, { status: 400 });
    }
    const match = await createMatch({
      homeTeam,
      awayTeam,
      handicap: parseHandicap(handicap),
      kickoff: kickoffIso,
    });
    void notifyMatchCreated({
      matchStt: match.stt,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      handicap: match.handicap,
      kickoff: match.kickoff,
    });
    return NextResponse.json({ match });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tạo trận" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.title !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { matchId, status } = await request.json();
    if (!matchId || !status) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }
    await updateMatchStatus(matchId, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}
