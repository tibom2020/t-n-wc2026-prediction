import { choiceLabels } from "@/lib/choice-styles";
import type { Choice } from "@/types";

export interface PredictionStats {
  HOME: number;
  AWAY: number;
  DRAW: number;
}

const barStyles: Record<Choice, { track: string; fill: string }> = {
  HOME: { track: "bg-blue-100", fill: "bg-blue-600" },
  AWAY: { track: "bg-orange-100", fill: "bg-orange-600" },
  DRAW: { track: "bg-gray-100", fill: "bg-gray-500" },
};

export function PredictionStatsBars({
  stats,
  choices,
}: {
  stats: PredictionStats;
  choices: Choice[];
}) {
  const total = choices.reduce((sum, c) => sum + stats[c], 0);
  const max = Math.max(1, ...choices.map((c) => stats[c]));

  return (
    <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <p className="text-xs font-semibold text-gray-600">
        Thống kê bình chọn{total > 0 ? ` (${total})` : ""}
      </p>
      {choices.map((choice) => {
        const count = stats[choice];
        const width = total > 0 ? (count / max) * 100 : 0;
        const { track, fill } = barStyles[choice];

        return (
          <div key={choice} className="flex items-center gap-2">
            <span className="w-10 shrink-0 text-xs font-bold text-gray-600">
              {choiceLabels[choice]}
            </span>
            <div className={`h-2.5 min-w-0 flex-1 overflow-hidden rounded-full ${track}`}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${fill}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="w-5 shrink-0 text-right text-xs font-semibold text-gray-700">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
