import { NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE, createSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/normalize";
import { findUserBySdt } from "@/lib/sheets";

export async function POST(request: Request) {
  try {
    const { sdt } = await request.json();
    if (!sdt || typeof sdt !== "string") {
      return NextResponse.json({ error: "Vui lòng nhập số điện thoại" }, { status: 400 });
    }
    const phone = normalizePhone(sdt);
    if (!/^0\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
    }
    const user = await findUserBySdt(phone);
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
    }
    const token = await createSession({
      stt: user.stt,
      fullName: user.fullName,
      title: user.title,
    });
    const res = NextResponse.json({ user: { stt: user.stt, fullName: user.fullName, title: user.title } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lỗi đăng nhập" }, { status: 500 });
  }
}
