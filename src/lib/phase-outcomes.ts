import { PHASE1_OUTCOME_ROWS } from "@/data/phase1-outcomes";
import {
  sortUserOutcomeTotalsByRank,
  type UserOutcomeTotal,
} from "@/lib/prediction-outcome";

export type PhaseFilter = "phase1" | "combined";

export function getPhase1OutcomeTotals(): UserOutcomeTotal[] {
  return sortUserOutcomeTotalsByRank(PHASE1_OUTCOME_ROWS.map((row) => ({ ...row })));
}

export function resolveLeaderboardOutcomeTotals(
  phase2Totals: UserOutcomeTotal[],
  phaseFilter: PhaseFilter
): UserOutcomeTotal[] {
  if (phaseFilter === "phase1") {
    return getPhase1OutcomeTotals();
  }

  const merged = new Map<number, UserOutcomeTotal>();

  for (const row of PHASE1_OUTCOME_ROWS) {
    merged.set(row.userStt, { ...row });
  }

  for (const row of phase2Totals) {
    const existing = merged.get(row.userStt);
    if (existing) {
      existing.win += row.win;
      existing.draw += row.draw;
      existing.lose += row.lose;
      existing.userName = row.userName;
    } else {
      merged.set(row.userStt, { ...row });
    }
  }

  return sortUserOutcomeTotalsByRank(Array.from(merged.values()));
}
