import { PHASE1_OUTCOME_ROWS } from "@/data/phase1-outcomes";
import type { UserContributionTotal } from "@/lib/prediction-board";
import {
  sortUserOutcomeTotalsByRank,
  type UserOutcomeTotal,
} from "@/lib/prediction-outcome";

export type PhaseFilter = "phase1" | "combined";

export function outcomeTotalToContribution(outcome: UserOutcomeTotal): number {
  return outcome.draw * 10 + outcome.lose * 30;
}

export function getPhase1OutcomeTotals(): UserOutcomeTotal[] {
  return sortUserOutcomeTotalsByRank(PHASE1_OUTCOME_ROWS.map((row) => ({ ...row })));
}

export function getPhase1ContributionTotals(): UserContributionTotal[] {
  return getPhase1OutcomeTotals()
    .map((row) => ({
      userStt: row.userStt,
      userName: row.userName,
      total: outcomeTotalToContribution(row),
    }))
    .sort((a, b) => b.total - a.total || a.userStt - b.userStt);
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

export function resolveLeaderboardContributionTotals(
  phase2Totals: UserContributionTotal[],
  phaseFilter: PhaseFilter
): UserContributionTotal[] {
  if (phaseFilter === "phase1") {
    return getPhase1ContributionTotals();
  }

  const merged = new Map<number, UserContributionTotal>();

  for (const row of getPhase1ContributionTotals()) {
    merged.set(row.userStt, { ...row });
  }

  for (const row of phase2Totals) {
    const existing = merged.get(row.userStt);
    if (existing) {
      existing.total += row.total;
      existing.userName = row.userName;
    } else {
      merged.set(row.userStt, { ...row });
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.total - a.total || a.userStt - b.userStt);
}
