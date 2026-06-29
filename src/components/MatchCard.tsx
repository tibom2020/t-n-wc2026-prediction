"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { canDrawOnHandicap } from "@/lib/handicap";
import { isVotingOpen } from "@/lib/match";
import { formatGMT7 } from "@/lib/datetime";
import { formatHandicapLine } from "@/lib/utils";
import { choiceLabels, getChoiceBadgeClass } from "@/lib/choice-styles";
import { PredictionStatsBars, type PredictionStats } from "@/components/PredictionStatsBars";
import type { Match, Choice } from "@/types";

export function MatchCard({
  match,
  userChoice,
  stats,
  pendingUsers = [],
  onPredict,
}: {
  match: Match;
  userChoice?: Choice;
  stats?: PredictionStats;
  pendingUsers?: string[];
  onPredict: (matchId: string, choice: Choice) => Promise<void>;
}) {
  const [loading, setLoading] = useState<Choice | null>(null);
  const [error, setError] = useState("");
  const [showPending, setShowPending] = useState(false);
  const allowDraw = canDrawOnHandicap(match.handicap);
  const isSettled = match.status === "settled";
  const votingOpen = isVotingOpen(match);

  async function handleChoice(choice: Choice) {
    setError("");
    setLoading(choice);
    try {
      await onPredict(match.matchId, choice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(null);
    }
  }

  const choices: Choice[] = allowDraw ? ["HOME", "AWAY", "DRAW"] : ["HOME", "AWAY"];

  return (
    <div className="overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-wc-dark px-3 py-1.5">
        <span className="rounded bg-wc-gold px-2 py-0.5 text-xs font-bold text-wc-dark">
          Trận #{match.stt}
        </span>
      </div>
      {/* Team header */}
      <div className="grid grid-cols-[1fr_auto_1fr]">
        <div className="bg-blue-100 px-3 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Home</p>
          <p className="mt-0.5 text-sm font-bold leading-tight text-blue-900 sm:text-base">
            {match.homeTeam}
          </p>
        </div>
        <div className="flex items-center justify-center bg-gray-50 px-2">
          <span className="text-xs font-bold text-gray-400">VS</span>
        </div>
        <div className="bg-orange-100 px-3 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">Away</p>
          <p className="mt-0.5 text-sm font-bold leading-tight text-orange-900 sm:text-base">
            {match.awayTeam}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">
              <span className="mr-1.5 font-bold text-amber-600">Kèo</span>
              <span className="font-semibold">{formatHandicapLine(match.homeTeam, match.awayTeam, match.handicap)}</span>
            </span>
            <span className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-900">
              <span className="mr-1.5 font-bold text-indigo-500">Giờ đá</span>
              {formatGMT7(match.kickoff)}
              <span className="ml-1 text-indigo-400">(GMT+7)</span>
            </span>
          </div>
          <StatusBadge status={match.status} userChoice={userChoice} votingOpen={votingOpen} />
        </div>

        <p className={`text-xs ${votingOpen ? "text-wc-green" : "text-red-600"}`}>
          Hết hạn bình chọn: khi trận bắt đầu
        </p>

        {!allowDraw && !isSettled && votingOpen && (
          <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
            Kèo lẻ — chỉ chọn HOME hoặc AWAY
          </p>
        )}

        {match.status === "open" && (
          <>
            <PredictionStatsBars stats={stats ?? { HOME: 0, AWAY: 0, DRAW: 0 }} choices={choices} />
            <div>
              <button
                type="button"
                onClick={() => setShowPending((v) => !v)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                {showPending ? "Ẩn danh sách" : "Xem chưa chọn"}
                {!showPending && pendingUsers.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
              {showPending && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  {pendingUsers.length === 0 ? (
                    <p className="text-xs font-medium text-green-700">Tất cả thành viên đã chọn</p>
                  ) : (
                    <>
                      <p className="mb-1.5 text-xs font-semibold text-gray-600">
                        Chưa chọn ({pendingUsers.length})
                      </p>
                      <ul className="flex flex-wrap gap-1.5">
                        {pendingUsers.map((name) => (
                          <li
                            key={name}
                            className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-800"
                          >
                            {name}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {isSettled && match.handicapResult && (
          <p className="rounded-lg bg-wc-light px-2.5 py-1.5 text-sm text-wc-dark">
            Kết quả kèo:{" "}
            <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-bold ${getChoiceBadgeClass(match.handicapResult)}`}>
              {choiceLabels[match.handicapResult]}
            </span>
            {match.homeScore !== null && ` (${match.homeScore}-${match.awayScore})`}
          </p>
        )}

        {votingOpen ? (
          <div>
            {userChoice && (
              <p className="mb-2 text-xs text-gray-500">
                Bạn có thể đổi lựa chọn trước khi trận bắt đầu
              </p>
            )}
            <div className={`grid gap-2 ${choices.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {choices.map((c) => {
                const selected = userChoice === c;
                return (
                  <button
                    key={c}
                    disabled={!!loading}
                    onClick={() => handleChoice(c)}
                    className={`relative ${
                      c === "HOME"
                        ? selected
                          ? "rounded-lg bg-blue-800 px-3 py-2.5 text-sm font-bold text-white shadow-md ring-2 ring-blue-500 ring-offset-2 transition-all disabled:opacity-50"
                          : "rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-800 disabled:opacity-50"
                        : c === "AWAY"
                          ? selected
                            ? "rounded-lg bg-orange-700 px-3 py-2.5 text-sm font-bold text-white shadow-md ring-2 ring-orange-500 ring-offset-2 transition-all disabled:opacity-50"
                            : "rounded-lg bg-orange-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-700 disabled:opacity-50"
                          : selected
                            ? "rounded-lg bg-gray-700 px-3 py-2.5 text-sm font-bold text-white shadow-md ring-2 ring-gray-500 ring-offset-2 transition-all disabled:opacity-50"
                            : "rounded-lg bg-gray-500 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-gray-700 disabled:opacity-50"
                    }`}
                  >
                    {selected && (
                      <span
                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-wc-gold text-wc-dark shadow-lg ring-2 ring-white"
                        aria-hidden
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                    {loading === c ? "..." : choiceLabels[c]}
                  </button>
                );
              })}
            </div>
          </div>
        ) : userChoice ? (
          <div className={`relative rounded-lg border px-3 py-2.5 text-sm font-semibold ${getChoiceBadgeClass(userChoice)}`}>
            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-wc-gold text-wc-dark shadow-lg ring-2 ring-white">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            Bạn chọn: {choiceLabels[userChoice]}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Đã hết hạn bình chọn</p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  userChoice,
  votingOpen,
}: {
  status: string;
  userChoice?: Choice;
  votingOpen: boolean;
}) {
  if (status === "settled") {
    return <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Kết thúc</span>;
  }
  if (!votingOpen) {
    return <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Đã khóa</span>;
  }
  if (userChoice) {
    return (
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${getChoiceBadgeClass(userChoice)}`}>
        Đã chọn
      </span>
    );
  }
  return <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Đang mở</span>;
}
