export type UserRole = "admin" | "user";
export type Choice = "HOME" | "AWAY" | "DRAW";
export type HandicapResult = "HOME" | "AWAY" | "DRAW";
export type MatchStatus = "open" | "closed" | "settled";

export interface User {
  stt: number;
  fullName: string;
  title: UserRole;
  sdt: string;
}

export interface Match {
  matchId: string;
  stt: number;
  homeTeam: string;
  awayTeam: string;
  handicap: number;
  kickoff: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  handicapResult: HandicapResult | null;
  createdAt: string;
  votingClosedNotified: boolean;
}

export interface Prediction {
  predictionId: string;
  matchId: string;
  userStt: number;
  userName: string;
  choice: Choice | null;
  contribution: number | null;
  createdAt: string;
}

export interface SessionUser {
  stt: number;
  fullName: string;
  title: UserRole;
}
