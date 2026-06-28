export type PredictionOutcome = "win" | "draw" | "lose" | "pending";

export interface UserOutcomeTotal {
  userStt: number;
  userName: string;
  win: number;
  draw: number;
  lose: number;
}

export interface OutcomeSummary {
  win: number;
  draw: number;
  lose: number;
}

export function getPredictionOutcome(contribution: number | null): PredictionOutcome {
  if (contribution === null) return "pending";
  if (contribution === 0) return "win";
  if (contribution === 10) return "draw";
  return "lose";
}

export function formatPredictionOutcome(contribution: number | null): string {
  const outcome = getPredictionOutcome(contribution);
  if (outcome === "win") return "Thắng";
  if (outcome === "draw") return "Hòa";
  if (outcome === "lose") return "Thua";
  return "Chờ kết quả";
}

export function getOutcomeBadgeClass(outcome: PredictionOutcome): string {
  if (outcome === "win") return "text-green-600";
  if (outcome === "draw") return "text-gray-600";
  if (outcome === "lose") return "text-red-600";
  return "text-gray-400";
}

export function sumOutcomeTotals(totals: UserOutcomeTotal[]): OutcomeSummary {
  return totals.reduce(
    (acc, u) => ({
      win: acc.win + u.win,
      draw: acc.draw + u.draw,
      lose: acc.lose + u.lose,
    }),
    { win: 0, draw: 0, lose: 0 }
  );
}

export function countOutcomeFromContributions(
  contributions: Array<number | null>
): OutcomeSummary {
  const summary: OutcomeSummary = { win: 0, draw: 0, lose: 0 };
  for (const c of contributions) {
    const outcome = getPredictionOutcome(c);
    if (outcome === "win") summary.win += 1;
    else if (outcome === "draw") summary.draw += 1;
    else if (outcome === "lose") summary.lose += 1;
  }
  return summary;
}

/** BXH: Thắng ↓, Hòa ↓, Thua ↑ (ít thua hơn xếp trên) */
export function sortUserOutcomeTotalsByRank(totals: UserOutcomeTotal[]): UserOutcomeTotal[] {
  return [...totals].sort((a, b) => {
    if (b.win !== a.win) return b.win - a.win;
    if (b.draw !== a.draw) return b.draw - a.draw;
    if (a.lose !== b.lose) return a.lose - b.lose;
    return a.userStt - b.userStt;
  });
}
