"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ContributionsBoardTable } from "@/components/ContributionsBoardTable";
import type { PredictionBoardRow, UserContributionTotal } from "@/lib/prediction-board";
import type { UserOutcomeTotal } from "@/lib/prediction-outcome";
import { sumOutcomeTotals } from "@/lib/prediction-outcome";
import { resolveLeaderboardContributionTotals, resolveLeaderboardOutcomeTotals, type PhaseFilter } from "@/lib/phase-outcomes";
import type { SessionUser } from "@/types";

type StatsViewMode = "outcome" | "contribution";

const LEADERBOARD_STICKERS = ["🥇", "🥈", "🥉"] as const;

function PhaseToggle({
  value,
  onChange,
}: {
  value: PhaseFilter;
  onChange: (v: PhaseFilter) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("phase1")}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          value === "phase1"
            ? "bg-wc-gold text-wc-dark"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Đợt 1
      </button>
      <button
        type="button"
        onClick={() => onChange("combined")}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          value === "combined"
            ? "bg-wc-gold text-wc-dark"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Đợt 1 + Đợt 2
      </button>
    </div>
  );
}

function OutcomeLeaderboardTable({ totals }: { totals: UserOutcomeTotal[] }) {
  const groupOutcome = sumOutcomeTotals(totals);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm">
      <div className="bg-wc-dark px-4 py-3">
        <p className="text-sm font-semibold text-white">Tổng kết quả theo thành viên</p>
        <p className="text-xs text-green-200">
          Tổng nhóm:{" "}
          <span className="font-bold text-green-400">Thắng {groupOutcome.win}</span>
          {" · "}
          <span className="font-bold text-gray-300">Hòa {groupOutcome.draw}</span>
          {" · "}
          <span className="font-bold text-red-400">Thua {groupOutcome.lose}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">STT</th>
              <th className="px-4 py-2 font-medium">Họ tên</th>
              <th className="px-4 py-2 font-medium text-center text-green-600">Thắng</th>
              <th className="px-4 py-2 font-medium text-center text-gray-600">Hòa</th>
              <th className="px-4 py-2 font-medium text-center text-red-600">Thua</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((u, index) => (
              <tr key={`${u.userStt}-${u.userName}`} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-600">{u.userStt}</td>
                <td className="px-4 py-2.5 font-medium text-wc-dark">
                  {index < 3 && (
                    <span className="mr-1" aria-hidden>
                      {LEADERBOARD_STICKERS[index]}
                    </span>
                  )}
                  {u.userName}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-green-600">{u.win}</td>
                <td className="px-4 py-2.5 text-center font-bold text-gray-600">{u.draw}</td>
                <td className="px-4 py-2.5 text-center font-bold text-red-600">{u.lose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [rows, setRows] = useState<PredictionBoardRow[]>([]);
  const [userTotals, setUserTotals] = useState<UserContributionTotal[]>([]);
  const [userOutcomeTotals, setUserOutcomeTotals] = useState<UserOutcomeTotal[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<StatsViewMode>("outcome");
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("combined");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [meRes, dataRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/predictions/board"),
      ]);
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const me = await meRes.json();
      setUser(me.user);
      if (dataRes.ok) {
        const data = await dataRes.json();
        setRows(data.rows || []);
        setUserTotals(data.userTotals || []);
        setUserOutcomeTotals(data.userOutcomeTotals || []);
        setIsAdmin(data.isAdmin ?? false);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;
  }

  const effectiveViewMode: StatsViewMode = isAdmin ? viewMode : "outcome";
  const displayOutcomeTotals = resolveLeaderboardOutcomeTotals(userOutcomeTotals, phaseFilter);
  const displayContributionTotals = resolveLeaderboardContributionTotals(userTotals, phaseFilter);
  const grandTotal = displayContributionTotals.reduce((sum, u) => sum + u.total, 0);

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-wc-dark">
              {effectiveViewMode === "outcome" ? "Thống kê kết quả" : "Thống kê đóng góp"}
            </h2>
            <p className="text-sm text-gray-500">
              {user.title === "admin"
                ? "Theo trận và theo thành viên (tất cả trận)"
                : "Chỉ hiển thị các trận đã hết hạn bình chọn"}
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg bg-wc-green px-3 py-1.5 text-sm font-medium text-white hover:bg-wc-dark"
          >
            ← Dự đoán
          </Link>
        </div>

        {isAdmin && (
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("outcome")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "outcome"
                  ? "bg-wc-dark text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Kết quả
            </button>
            <button
              type="button"
              onClick={() => setViewMode("contribution")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "contribution"
                  ? "bg-wc-dark text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Đóng góp
            </button>
          </div>
        )}

        {(effectiveViewMode === "outcome" || effectiveViewMode === "contribution") && (
          <PhaseToggle value={phaseFilter} onChange={setPhaseFilter} />
        )}

        {effectiveViewMode === "outcome" && (
          <>
            {displayOutcomeTotals.length > 0 && (
              <OutcomeLeaderboardTable totals={displayOutcomeTotals} />
            )}
          </>
        )}

        {effectiveViewMode === "contribution" && displayContributionTotals.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm">
            <div className="bg-wc-dark px-4 py-3">
              <p className="text-sm font-semibold text-white">Tổng đóng góp theo thành viên</p>
              <p className="text-xs text-green-200">
                Tổng cộng nhóm: <span className="font-bold text-wc-gold">{grandTotal}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2 font-medium">STT</th>
                    <th className="px-4 py-2 font-medium">Họ tên</th>
                    <th className="px-4 py-2 font-medium text-right">Tổng đóng góp</th>
                  </tr>
                </thead>
                <tbody>
                  {displayContributionTotals.map((u) => (
                    <tr key={u.userStt} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-600">{u.userStt}</td>
                      <td className="px-4 py-2.5 font-medium text-wc-dark">{u.userName}</td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold ${
                          u.total === 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {u.total === 0 ? "0" : `-${u.total}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <h3 className="mb-3 text-lg font-bold text-wc-dark">Chi tiết theo trận</h3>
        <ContributionsBoardTable rows={rows} viewMode={effectiveViewMode} />
      </main>
    </div>
  );
}
