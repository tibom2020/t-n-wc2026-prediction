"use client";

import { formatGMT7 } from "@/lib/datetime";
import { formatContribution, formatHandicapLine } from "@/lib/utils";
import { formatChoiceLabel, getChoiceBadgeClass, choiceLabels } from "@/lib/choice-styles";
import {
  formatPredictionOutcome,
  getOutcomeBadgeClass,
  getPredictionOutcome,
} from "@/lib/prediction-outcome";
import type { PredictionBoardRow } from "@/lib/prediction-board";

export function ContributionsBoardTable({
  rows,
  viewMode = "outcome",
}: {
  rows: PredictionBoardRow[];
  viewMode?: "outcome" | "contribution";
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-gray-500">Chưa có dữ liệu dự đoán</p>;
  }

  const grouped = rows.reduce<Record<number, PredictionBoardRow[]>>((acc, row) => {
    const stt = row.match?.stt ?? 0;
    if (!acc[stt]) acc[stt] = [];
    acc[stt].push(row);
    return acc;
  }, {});

  const matchStts = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {matchStts.map((stt) => {
        const matchRows = grouped[stt];
        const match = matchRows[0]?.match;
        if (!match) return null;

        const matchContribution = matchRows.reduce(
          (sum, row) => sum + (row.contribution ?? 0),
          0
        );

        return (
          <div key={stt} className="overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm">
            <div className="bg-wc-dark px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded bg-wc-gold px-2 py-0.5 text-xs font-bold text-wc-dark">
                    Trận #{match.stt}
                  </span>
                  <p className="mt-1 font-semibold text-white">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  <p className="text-xs text-green-200">
                    {formatHandicapLine(match.homeTeam, match.awayTeam, match.handicap)}
                    {match.handicapResult && (
                      <span className="ml-2">
                        | Kết quả: {choiceLabels[match.handicapResult]}
                        {match.homeScore !== null && ` (${match.homeScore}-${match.awayScore})`}
                      </span>
                    )}
                  </p>
                </div>
                {match.status === "settled" && viewMode === "contribution" && (
                  <div className="text-right">
                    <p className="text-[10px] text-green-200">Tổng đóng góp trận</p>
                    <p className="text-lg font-bold text-wc-gold">{matchContribution}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2 font-medium">STT</th>
                    <th className="px-4 py-2 font-medium">Họ tên</th>
                    <th className="px-4 py-2 font-medium">Lựa chọn</th>
                    <th className="px-4 py-2 font-medium">
                      {viewMode === "outcome" ? "Kết quả" : "Đóng góp"}
                    </th>
                    <th className="px-4 py-2 font-medium">Thời gian chọn</th>
                  </tr>
                </thead>
                <tbody>
                  {matchRows
                    .sort((a, b) => a.userStt - b.userStt)
                    .map((row) => (
                      <tr key={row.predictionId} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-600">{row.userStt}</td>
                        <td className="px-4 py-2.5 font-medium text-wc-dark">{row.userName}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${getChoiceBadgeClass(row.choice)}`}
                          >
                            {formatChoiceLabel(row.choice)}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-2.5 font-bold ${
                            viewMode === "outcome"
                              ? getOutcomeBadgeClass(getPredictionOutcome(row.contribution))
                              : row.contribution === 0
                                ? "text-green-600"
                                : row.contribution
                                  ? "text-red-600"
                                  : "text-gray-400"
                          }`}
                        >
                          {viewMode === "outcome"
                            ? formatPredictionOutcome(row.contribution)
                            : formatContribution(row.contribution)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">
                          {formatGMT7(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">
              {matchRows.filter((row) => row.choice).length} thành viên đã chọn
              {matchRows.some((row) => !row.choice)
                ? ` · ${matchRows.filter((row) => !row.choice).length} không dự đoán`
                : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
