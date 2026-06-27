import type { Choice, HandicapResult } from "@/types";

export function canDrawOnHandicap(handicap: number): boolean {
  return handicap % 1 === 0;
}

export function calcHandicapResult(
  homeScore: number,
  awayScore: number,
  handicap: number
): HandicapResult {
  const adjustedDiff = homeScore + handicap - awayScore;
  if (adjustedDiff > 0) return "HOME";
  if (adjustedDiff < 0) return "AWAY";
  return "DRAW";
}

export function calcContribution(
  choice: Choice,
  result: HandicapResult
): number {
  if (choice === result) return 0;
  if (result === "DRAW") return 10;
  if (choice === "DRAW") return 10;
  return 30;
}

export const MISSING_PREDICTION_CONTRIBUTION = 30;
