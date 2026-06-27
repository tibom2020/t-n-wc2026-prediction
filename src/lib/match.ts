import { isPastDeadline } from "@/lib/datetime";
import type { Match } from "@/types";

export function isVotingOpen(match: Match): boolean {
  if (match.status === "settled" || match.status === "closed") return false;
  if (match.kickoff && isPastDeadline(match.kickoff)) return false;
  return true;
}
