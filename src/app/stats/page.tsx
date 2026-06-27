"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ContributionsBoardTable } from "@/components/ContributionsBoardTable";
import type { PredictionBoardRow, UserContributionTotal } from "@/lib/prediction-board";
import type { SessionUser } from "@/types";

export default function StatsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [rows, setRows] = useState<PredictionBoardRow[]>([]);
  const [userTotals, setUserTotals] = useState<UserContributionTotal[]>([]);
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
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;
  }

  const grandTotal = userTotals.reduce((sum, u) => sum + u.total, 0);

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-wc-dark">Thống kê đóng góp</h2>
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

        {userTotals.length > 0 && (
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
                  {userTotals.map((u) => (
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
        <ContributionsBoardTable rows={rows} />
      </main>
    </div>
  );
}
