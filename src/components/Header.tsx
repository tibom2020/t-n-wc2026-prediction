"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";

export function Header({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-wc-dark text-white shadow-lg">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-sm font-bold leading-tight text-wc-gold sm:text-base">
            NHẬN ĐỊNH BÓNG ĐÁ WC 2026
          </h1>
          <p className="text-xs text-green-200">Xin chào, {user.fullName}</p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="hover:text-wc-gold">Dự đoán</Link>
          <Link href="/stats" className="hover:text-wc-gold">Thống kê</Link>
          <Link href="/history" className="hover:text-wc-gold">Lịch sử</Link>
          {user.title === "admin" && (
            <Link href="/admin/matches" className="hover:text-wc-gold">Trận</Link>
          )}
          <button onClick={logout} className="rounded bg-white/10 px-2 py-1 hover:bg-white/20">
            Thoát
          </button>
        </nav>
      </div>
    </header>
  );
}
