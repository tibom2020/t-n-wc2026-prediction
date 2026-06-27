"use client";

import { formatGMT7 } from "@/lib/datetime";
import { formatContribution, formatHandicapLine } from "@/lib/utils";
import { formatChoiceLabel, getChoiceBadgeClass, choiceLabels } from "@/lib/choice-styles";
import type { Choice } from "@/types";

export interface AdminPredictionRow {
  predictionId: string;
  userStt: number;
  userName: string;
  choice: Choice | null;
  contribution: number | null;
  createdAt: string;
  match: {
    stt: number;
    homeTeam: string;
    awayTeam: string;
    handicap: number;
    kickoff: string;
    status: string;
    handicapResult: Choice | null;
    homeScore: number | null;
    awayScore: number | null;
  } | null;
}

export function AdminPredictionsTable({ rows }: { rows: AdminPredictionRow[] }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-gray-500">Chưa có lựa chọn nào</p>;
  }

  const grouped = rows.reduce<Record<number, AdminPredictionRow[]>>((acc, row) => {
    const stt = row.match?.stt ?? 0;
    if (!acc[stt]) acc[stt] = [];
    acc[stt].push(row);
    return acc;
  }, {});

  const matchStts = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {matchStts.map((stt) => {
        const matchRows = grouped[stt];
        const match = matchRows[0]?.match;
        if (!match) return null;

        return (
          <div key={stt} className="overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm">
            <div className="bg-wc-dark px-4 py-3">
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

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2 font-medium">STT</th>
                    <th className="px-4 py-2 font-medium">Họ tên</th>
                    <th className="px-4 py-2 font-medium">Lựa chọn</th>
                    <th className="px-4 py-2 font-medium">Đóng góp</th>
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
                            row.contribution === 0
                              ? "text-green-600"
                              : row.contribution
                                ? "text-red-600"
                                : "text-gray-400"
                          }`}
                        >
                          {formatContribution(row.contribution)}
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
              {matchRows.filter((row) => row.choice).length} user đã chọn
              {matchRows.some((row) => !row.choice)
                ? ` · ${matchRows.filter((row) => !row.choice).length} user không dự đoán`
                : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
