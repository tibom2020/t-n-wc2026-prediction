"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REMEMBER_KEY = "wc_login_remember";
const SDT_KEY = "wc_login_sdt";

export default function LoginPage() {
  const router = useRouter();
  const [sdt, setSdt] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedRemember = localStorage.getItem(REMEMBER_KEY) === "true";
    const savedSdt = localStorage.getItem(SDT_KEY);
    if (savedRemember && savedSdt) {
      setRemember(true);
      setSdt(savedSdt);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi đăng nhập");

      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "true");
        localStorage.setItem(SDT_KEY, sdt.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(SDT_KEY);
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-wc-dark to-wc-green px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold leading-snug text-wc-dark">
            NHẬN ĐỊNH BÓNG ĐÁ WC 2026
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input
              value={sdt}
              onChange={(e) => setSdt(e.target.value)}
              placeholder="vd: 0912345678"
              type="tel"
              inputMode="numeric"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-wc-green focus:outline-none focus:ring-1 focus:ring-wc-green"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-wc-green focus:ring-wc-green"
            />
            Nhớ thông tin đăng nhập
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-wc-green py-3 font-semibold text-white hover:bg-wc-dark disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
