import { formatContribution, formatHandicapLine } from "@/lib/utils";
import { choiceLabels, formatChoiceLabel, getChoiceBadgeClass } from "@/lib/choice-styles";
import type { Choice } from "@/types";

export interface HistoryItem {
  predictionId: string;
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

export function HistoryTable({
  history,
  totalContribution,
}: {
  history: HistoryItem[];
  totalContribution: number;
}) {
  if (history.length === 0) {
    return <p className="text-center text-gray-500 py-8">Chưa có lịch sử dự đoán</p>;
  }

  return (
    <div>
      <div className="mb-4 rounded-xl bg-wc-dark p-4 text-white">
        <p className="text-sm text-green-200">Tổng đóng góp</p>
        <p className="text-3xl font-bold text-wc-gold">{totalContribution}</p>
      </div>
      <div className="space-y-3">
        {history.map((h) => (
          <div key={h.predictionId} className="rounded-xl border border-green-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {h.match?.stt ? (
                  <span className="mb-1 inline-block rounded bg-wc-dark px-2 py-0.5 text-[10px] font-bold text-wc-gold">
                    Trận #{h.match.stt}
                  </span>
                ) : null}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-sm font-semibold text-blue-900">
                    {h.match?.homeTeam}
                  </span>
                  <span className="text-xs text-gray-400">vs</span>
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-sm font-semibold text-orange-900">
                    {h.match?.awayTeam}
                  </span>
                </div>
                <p className="mt-1.5 text-xs">
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">
                    Kèo: {formatHandicapLine(h.match?.homeTeam ?? "", h.match?.awayTeam ?? "", h.match?.handicap ?? 0)}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(h.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <span
                className={`text-lg font-bold ${
                  h.contribution === 0 ? "text-green-600" : h.contribution ? "text-red-600" : "text-gray-400"
                }`}
              >
                {formatContribution(h.contribution)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${getChoiceBadgeClass(h.choice)}`}>
                Chọn: {formatChoiceLabel(h.choice)}
              </span>
              {h.match?.handicapResult && (
                <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${getChoiceBadgeClass(h.match.handicapResult)}`}>
                  Kết quả: {choiceLabels[h.match.handicapResult]}
                </span>
              )}
              {h.match && h.match.homeScore !== null && h.match.awayScore !== null && (
                <span>Tỉ số: {h.match?.homeScore}-{h.match?.awayScore}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


