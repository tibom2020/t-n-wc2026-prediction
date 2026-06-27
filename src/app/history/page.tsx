"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { HistoryTable, type HistoryItem } from "@/components/HistoryTable";
import type { SessionUser } from "@/types";

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [meRes, histRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/predictions/mine"),
      ]);
      if (!meRes.ok) { router.push("/login"); return; }
      const me = await meRes.json();
      setUser(me.user);
      const data = await histRes.json();
      setHistory(data.history || []);
      setTotal(data.totalContribution || 0);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="mb-4 text-xl font-bold text-wc-dark">Lịch sử dự đoán</h2>
        <HistoryTable history={history} totalContribution={total} />
      </main>
    </div>
  );
}
