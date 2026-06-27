import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseHandicap(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  const normalized = String(value).trim().replace(",", ".");
  const n = Number(normalized);
  return Number.isNaN(n) ? 0 : n;
}

export function formatHandicap(handicap: number): string {
  if (handicap === null || handicap === undefined || Number.isNaN(handicap)) return "-";
  const sign = handicap > 0 ? "+" : "";
  return `${sign}${handicap}`;
}

/** VD: Portugal chấp 0.5 (đội khách chấp) | Croatia chấp 0.5 (đội nhà chấp) | Croatia chấp 0 */
export function formatHandicapLine(
  homeTeam: string,
  awayTeam: string,
  handicap: number
): string {
  if (Number.isNaN(handicap)) return "-";
  if (handicap === 0) return `${homeTeam} chấp 0`;
  if (handicap < 0) return `${homeTeam} chấp ${Math.abs(handicap)}`;
  return `${awayTeam} chấp ${handicap}`;
}

export function formatContribution(amount: number | null): string {
  if (amount === null) return "Chờ kết quả";
  if (amount === 0) return "0";
  return `-${amount}`;
}
