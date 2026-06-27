"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { AdminPredictionsTable, type AdminPredictionRow } from "@/components/AdminPredictionsTable";
import type { SessionUser } from "@/types";

export default function AdminPredictionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [rows, setRows] = useState<AdminPredictionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [meRes, dataRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/predictions"),
      ]);
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const me = await meRes.json();
      if (me.user.title !== "admin") {
        router.push("/");
        return;
      }
      setUser(me.user);
      if (dataRes.ok) {
        const data = await dataRes.json();
        setRows(data.rows || []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-wc-dark">Lịch sử tất cả user</h2>
          <Link
            href="/admin/matches"
            className="rounded-lg bg-wc-green px-3 py-1.5 text-sm font-medium text-white hover:bg-wc-dark"
          >
            Quản lý trận
          </Link>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Tổng {rows.length} lựa chọn từ các user
        </p>
        <AdminPredictionsTable rows={rows} />
      </main>
    </div>
  );
}
