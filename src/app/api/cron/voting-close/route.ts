import { NextResponse } from "next/server";
import { getMatches } from "@/lib/sheets";
import { closeMatchWithNotification } from "@/lib/voting-close";

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
    const matches = await getMatches();

    const due = matches.filter(
      (m) =>
        m.status === "open" &&
        !m.votingClosedNotified &&
        isKickoffPassed(m.kickoff)
    );

    for (const match of due) {
      await closeMatchWithNotification(match);
    }

    return NextResponse.json({ processed: due.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
