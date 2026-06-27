import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPredictionBoardRows } from "@/lib/prediction-board";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.title !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await getPredictionBoardRows();
    return NextResponse.json({ rows, total: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi tải dữ liệu" }, { status: 500 });
  }
}
