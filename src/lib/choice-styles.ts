import type { Choice } from "@/types";

export const choiceLabels: Record<Choice, string> = {
  HOME: "HOME",
  AWAY: "AWAY",
  DRAW: "HÒA",
};

export function formatChoiceLabel(choice: Choice | null): string {
  if (!choice) return "Không dự đoán";
  return choiceLabels[choice];
}

export function getChoiceBadgeClass(choice: Choice | null): string {
  if (!choice) return "border bg-red-50 text-red-800 border-red-200";
  if (choice === "HOME") return "border bg-blue-100 text-blue-900 border-blue-300";
  if (choice === "AWAY") return "border bg-orange-100 text-orange-900 border-orange-300";
  return "border bg-gray-100 text-gray-800 border-gray-300";
}
