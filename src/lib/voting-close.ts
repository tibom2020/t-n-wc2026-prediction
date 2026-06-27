import {
  closeMatchVoting,
  getPredictions,
  getUsers,
} from "@/lib/sheets";
import { notifyVotingClosed } from "@/lib/telegram";
import type { Choice, Match, Prediction, User } from "@/types";

export function buildVotingStats(
  matchId: string,
  predictions: Prediction[],
  users: User[]
): { stats: Record<Choice, string[]>; notChosen: string[] } {
  const matchPredictions = predictions.filter(
    (p) => p.matchId === matchId && p.choice
  );
  const predictedUserStts = new Set(matchPredictions.map((p) => p.userStt));

  const stats: Record<Choice, string[]> = {
    HOME: [],
    AWAY: [],
    DRAW: [],
  };
  for (const p of matchPredictions) {
    if (p.choice) stats[p.choice].push(p.userName);
  }

  const notChosen = users
    .filter((u) => !predictedUserStts.has(u.stt))
    .map((u) => u.fullName);

  return { stats, notChosen };
}

export async function sendVotingClosedNotification(match: Match): Promise<void> {
  const [predictions, users] = await Promise.all([getPredictions(), getUsers()]);
  const { stats, notChosen } = buildVotingStats(match.matchId, predictions, users);

  await notifyVotingClosed({
    matchStt: match.stt,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    handicap: match.handicap,
    stats,
    notChosen,
  });
}

export async function closeMatchWithNotification(match: Match): Promise<void> {
  if (match.votingClosedNotified) return;
  await sendVotingClosedNotification(match);
  await closeMatchVoting(match.matchId);
}
