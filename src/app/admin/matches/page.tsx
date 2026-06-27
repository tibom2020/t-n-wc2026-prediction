"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { AdminMatchForm, AdminMatchList } from "@/components/AdminMatchForm";
import type { Match, SessionUser } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [meRes, matchRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/matches"),
    ]);
    if (!meRes.ok) { router.push("/login"); return; }
    const me = await meRes.json();
    if (me.user.title !== "admin") { router.push("/"); return; }
    setUser(me.user);
    const data = await matchRes.json();
    setMatches((data.matches || []).sort(
      (a: Match, b: Match) => b.stt - a.stt
    ));
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-wc-dark">Quản lý trận đấu</h2>
          <Link
            href="/admin/predictions"
            className="rounded-lg border border-wc-green px-3 py-1.5 text-sm font-medium text-wc-green hover:bg-wc-light"
          >
            Xem thống kê user
          </Link>
        </div>
        <AdminMatchForm onCreated={load} />
        <AdminMatchList matches={matches} onUpdate={load} />
      </main>
    </div>
  );
}
