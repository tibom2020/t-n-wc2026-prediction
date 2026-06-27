import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getPredictionBoardRows,
  getUserContributionTotals,
} from "@/lib/prediction-board";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.title === "admin";
    const rows = await getPredictionBoardRows({ closedOnly: !isAdmin });
    const userTotals = getUserContributionTotals(rows);

    return NextResponse.json({ rows, userTotals, total: rows.length, isAdmin });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tải thống kê" }, { status: 500 });
  }
}
