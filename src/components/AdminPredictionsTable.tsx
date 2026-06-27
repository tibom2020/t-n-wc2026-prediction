"use client";

import { ContributionsBoardTable } from "@/components/ContributionsBoardTable";
import type { PredictionBoardRow } from "@/lib/prediction-board";

export type AdminPredictionRow = PredictionBoardRow;

export function AdminPredictionsTable({ rows }: { rows: PredictionBoardRow[] }) {
  return <ContributionsBoardTable rows={rows} />;
}
