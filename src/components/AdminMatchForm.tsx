"use client";

import { useState } from "react";
import { formatGMT7 } from "@/lib/datetime";
import { isVotingOpen } from "@/lib/match";
import { formatHandicap, formatHandicapLine } from "@/lib/utils";
import { canDrawOnHandicap } from "@/lib/handicap";
import type { Match } from "@/types";

export function AdminMatchForm({ onCreated }: { onCreated: () => void }) {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [handicap, setHandicap] = useState("0");
  const [kickoff, setKickoff] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          handicap: Number(handicap),
          kickoff,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi");
      setHomeTeam("");
      setAwayTeam("");
      setHandicap("0");
      setKickoff("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  const h = Number(handicap);

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-green-200 bg-white p-4 space-y-3">
      <h3 className="font-semibold text-wc-dark">Tạo trận mới</h3>
      <p className="text-xs text-gray-500">
        Thời gian nhập theo giờ Việt Nam (GMT+7). Bình chọn tự đóng khi trận bắt đầu.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="Đội nhà" required
          className="rounded-lg border px-3 py-2 text-sm" />
        <input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="Đội khách" required
          className="rounded-lg border px-3 py-2 text-sm" />
        <input value={handicap} onChange={(e) => setHandicap(e.target.value)} placeholder="Handicap" required
          type="number" step="0.5"
          className="rounded-lg border px-3 py-2 text-sm" />
        <div>
          <label className="mb-1 block text-xs text-gray-500">Giờ trận bắt đầu (GMT+7)</label>
          <input value={kickoff} onChange={(e) => setKickoff(e.target.value)} type="datetime-local" required
            className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
      </div>
      {!canDrawOnHandicap(h) && !isNaN(h) && (
        <p className="text-xs text-amber-600">Kèo lẻ ({formatHandicap(h)}) — user chỉ chọn HOME/AWAY</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-wc-green py-2 font-semibold text-white hover:bg-wc-dark disabled:opacity-50">
        {loading ? "Đang tạo..." : "Tạo trận"}
      </button>
    </form>
  );
}

export function AdminMatchList({ matches, onUpdate }: { matches: Match[]; onUpdate: () => void }) {
  const [settling, setSettling] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const [error, setError] = useState("");

  async function closeMatch(matchId: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, status: "closed" }),
    });
    onUpdate();
  }

  async function settle(matchId: string) {
    const s = scores[matchId];
    if (!s?.home || !s?.away) return;
    setSettling(matchId);
    setError("");
    try {
      const res = await fetch(`/api/matches/${matchId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeScore: Number(s.home), awayScore: Number(s.away) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi");
      onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setSettling(null);
    }
  }

  if (matches.length === 0) return <p className="text-gray-500 text-center py-4">Chưa có trận nào</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {matches.map((m) => {
        const votingOpen = isVotingOpen(m);
        return (
          <div key={m.matchId} className="rounded-xl border border-green-200 bg-white p-4">
            <span className="mb-1 inline-block rounded bg-wc-dark px-2 py-0.5 text-xs font-bold text-wc-gold">
              Trận #{m.stt}
            </span>
            <p className="font-semibold">{m.homeTeam} vs {m.awayTeam}</p>
            <p className="text-sm text-gray-500">
              Kèo: {formatHandicapLine(m.homeTeam, m.awayTeam, m.handicap)} | {m.status}
            </p>
            <p className={`text-xs ${votingOpen ? "text-wc-green" : "text-red-600"}`}>
              Giờ đá / hết hạn bình chọn: {formatGMT7(m.kickoff)} (GMT+7)
              {!votingOpen && m.status !== "settled" ? " — đã khóa" : ""}
            </p>
            {votingOpen && (
              <button onClick={() => closeMatch(m.matchId)}
                className="mt-2 rounded bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600">
                Khóa bình chọn ngay
              </button>
            )}
            {m.status !== "settled" && (
              <div className="mt-2 flex items-center gap-2">
                <input placeholder="H" type="number" min="0"
                  value={scores[m.matchId]?.home || ""}
                  onChange={(e) => setScores({ ...scores, [m.matchId]: { ...scores[m.matchId], home: e.target.value, away: scores[m.matchId]?.away || "" } })}
                  className="w-16 rounded border px-2 py-1 text-sm" />
                <span>-</span>
                <input placeholder="A" type="number" min="0"
                  value={scores[m.matchId]?.away || ""}
                  onChange={(e) => setScores({ ...scores, [m.matchId]: { home: scores[m.matchId]?.home || "", away: e.target.value } })}
                  className="w-16 rounded border px-2 py-1 text-sm" />
                <button onClick={() => settle(m.matchId)} disabled={settling === m.matchId}
                  className="rounded bg-wc-green px-3 py-1 text-xs text-white hover:bg-wc-dark disabled:opacity-50">
                  {settling === m.matchId ? "..." : "Nhập tỉ số"}
                </button>
              </div>
            )}
            {m.status === "settled" && (
              <p className="mt-1 text-sm text-wc-green">
                {m.homeScore}-{m.awayScore} | Kèo: {m.handicapResult}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
