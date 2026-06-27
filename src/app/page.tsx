"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MatchCard } from "@/components/MatchCard";
import type { PredictionStats } from "@/components/PredictionStatsBars";
import type { Match, Choice, SessionUser } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Choice>>({});
  const [stats, setStats] = useState<Record<string, PredictionStats>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [meRes, matchRes, histRes, statsRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/matches"),
      fetch("/api/predictions/mine"),
      fetch("/api/predictions/stats"),
    ]);
    if (!meRes.ok) { router.push("/login"); return; }
    const me = await meRes.json();
    setUser(me.user);
    const matchData = await matchRes.json();
    setMatches((matchData.matches || []).filter((m: Match) => m.status !== "settled").sort(
      (a: Match, b: Match) => a.stt - b.stt
    ));
    const histData = await histRes.json();
    const predMap: Record<string, Choice> = {};
    for (const h of histData.history || []) predMap[h.matchId] = h.choice;
    setPredictions(predMap);
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      setStats(statsData.stats || {});
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function handlePredict(matchId: string, choice: Choice) {
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, choice }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi");
    setPredictions((prev) => {
      const previous = prev[matchId];
      setStats((statsPrev) => {
        const current = statsPrev[matchId] ?? { HOME: 0, AWAY: 0, DRAW: 0 };
        const next = { ...current };
        if (previous && previous !== choice) {
          next[previous] = Math.max(0, next[previous] - 1);
          next[choice] += 1;
        } else if (!previous) {
          next[choice] += 1;
        }
        return { ...statsPrev, [matchId]: next };
      });
      return { ...prev, [matchId]: choice };
    });
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-wc-dark">Trận đang mở</h2>
          <Link
            href="/stats"
            className="shrink-0 rounded-lg bg-wc-gold px-3 py-1.5 text-sm font-semibold text-wc-dark hover:bg-yellow-400"
          >
            Thống kê đóng góp
          </Link>
        </div>
        {matches.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có trận nào để dự đoán</p>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => (
              <MatchCard
                key={m.matchId}
                match={m}
                userChoice={predictions[m.matchId]}
                stats={stats[m.matchId] ?? { HOME: 0, AWAY: 0, DRAW: 0 }}
                onPredict={handlePredict}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
