import { getPredictions, getMatches } from "@/lib/sheets";
import { isVotingOpen } from "@/lib/match";
import { getPredictionOutcome, sortUserOutcomeTotalsByRank, type UserOutcomeTotal } from "@/lib/prediction-outcome";
import type { Choice } from "@/types";

export interface PredictionBoardRow {
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

export interface UserContributionTotal {
  userStt: number;
  userName: string;
  total: number;
}

export async function getPredictionBoardRows(options?: {
  closedOnly?: boolean;
}): Promise<PredictionBoardRow[]> {
  const [predictions, matches] = await Promise.all([
    getPredictions(),
    getMatches(),
  ]);

  const matchMap = new Map(matches.map((m) => [m.matchId, m]));

  return predictions
    .filter((p) => {
      if (!options?.closedOnly) return true;
      const match = matchMap.get(p.matchId);
      if (!match) return false;
      return !isVotingOpen(match);
    })
    .map((p) => {
      const match = matchMap.get(p.matchId);
      return {
        predictionId: p.predictionId,
        userStt: p.userStt,
        userName: p.userName,
        choice: p.choice,
        contribution: p.contribution,
        createdAt: p.createdAt,
        match: match
          ? {
              stt: match.stt,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              handicap: match.handicap,
              kickoff: match.kickoff,
              status: match.status,
              handicapResult: match.handicapResult,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
            }
          : null,
      };
    })
    .sort((a, b) => {
      const matchSttA = a.match?.stt ?? 0;
      const matchSttB = b.match?.stt ?? 0;
      if (matchSttA !== matchSttB) return matchSttB - matchSttA;
      return a.userStt - b.userStt;
    });
}

export function getUserContributionTotals(rows: PredictionBoardRow[]): UserContributionTotal[] {
  const totals = new Map<number, UserContributionTotal>();

  for (const row of rows) {
    if (row.contribution === null) continue;
    const existing = totals.get(row.userStt);
    if (existing) {
      existing.total += row.contribution;
    } else {
      totals.set(row.userStt, {
        userStt: row.userStt,
        userName: row.userName,
        total: row.contribution,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => a.userStt - b.userStt);
}

export function getUserOutcomeTotals(rows: PredictionBoardRow[]): UserOutcomeTotal[] {
  const totals = new Map<number, UserOutcomeTotal>();

  for (const row of rows) {
    const outcome = getPredictionOutcome(row.contribution);
    if (outcome === "pending") continue;

    const existing = totals.get(row.userStt);
    if (existing) {
      if (outcome === "win") existing.win += 1;
      else if (outcome === "draw") existing.draw += 1;
      else existing.lose += 1;
    } else {
      totals.set(row.userStt, {
        userStt: row.userStt,
        userName: row.userName,
        win: outcome === "win" ? 1 : 0,
        draw: outcome === "draw" ? 1 : 0,
        lose: outcome === "lose" ? 1 : 0,
      });
    }
  }

  return sortUserOutcomeTotalsByRank(Array.from(totals.values()));
}
