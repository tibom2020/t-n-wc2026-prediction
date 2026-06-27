import { formatHandicapLine } from "@/lib/utils";
import { formatGMT7 } from "@/lib/datetime";
import { choiceLabels } from "@/lib/choice-styles";
import type { Choice, HandicapResult } from "@/types";

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const config = getConfig();
  if (!config) return;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${config.token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram send failed:", res.status, body);
    }
  } catch (e) {
    console.error("Telegram send error:", e);
  }
}

export function formatPredictedMessage(data: {
  userName: string;
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
}): string {
  return (
    `⚽ <b>${escapeHtml(data.userName)}</b> đã dự đoán\n` +
    `Trận #${data.matchStt}: ${escapeHtml(data.homeTeam)} vs ${escapeHtml(data.awayTeam)}`
  );
}

export function formatVotingClosedMessage(data: {
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
  handicap: number;
  stats: Record<Choice, string[]>;
  notChosen: string[];
}): string {
  const line = formatHandicapLine(data.homeTeam, data.awayTeam, data.handicap);
  const homeList = formatList(data.stats.HOME);
  const awayList = formatList(data.stats.AWAY);
  const drawList = formatList(data.stats.DRAW);
  const missedList = formatList(data.notChosen);

  return (
    `🔒 <b>Đã kết thúc bình chọn</b>\n` +
    `Trận #${data.matchStt}: ${escapeHtml(data.homeTeam)} vs ${escapeHtml(data.awayTeam)}\n` +
    `Kèo: ${escapeHtml(line)}\n\n` +
    `🔵 ${escapeHtml(data.homeTeam)} — HOME (${data.stats.HOME.length}): ${homeList}\n` +
    `🟠 ${escapeHtml(data.awayTeam)} — AWAY (${data.stats.AWAY.length}): ${awayList}\n` +
    `⚪ HÒA (${data.stats.DRAW.length}): ${drawList}\n` +
    `❌ Chưa chọn (${data.notChosen.length}): ${missedList}`
  );
}

export function formatMatchCreatedMessage(data: {
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
  handicap: number;
  kickoff: string;
}): string {
  const line = formatHandicapLine(data.homeTeam, data.awayTeam, data.handicap);
  const deadline = formatGMT7(data.kickoff);

  return (
    `🆕 <b>Trận mới mở bình chọn</b>\n` +
    `Trận #${data.matchStt}: ${escapeHtml(data.homeTeam)} vs ${escapeHtml(data.awayTeam)}\n` +
    `Kèo: ${escapeHtml(line)}\n` +
    `⏰ Hạn chót: ${escapeHtml(deadline)}`
  );
}

export function formatPredictionProgressMessage(data: {
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
  predictedCount: number;
  totalCount: number;
  notChosen: string[];
}): string {
  const missedList = formatList(data.notChosen);

  return (
    `📊 <b>Thống kê dự đoán</b>\n` +
    `Trận #${data.matchStt}: ${escapeHtml(data.homeTeam)} vs ${escapeHtml(data.awayTeam)}\n` +
    `Đã dự đoán: <b>${data.predictedCount}/${data.totalCount}</b>\n` +
    `❌ Chưa dự đoán (${data.notChosen.length}): ${missedList}`
  );
}

export async function notifyPredictionProgress(data: {
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
  predictedCount: number;
  totalCount: number;
  notChosen: string[];
}): Promise<void> {
  await sendTelegramMessage(formatPredictionProgressMessage(data));
}

export async function notifyMatchCreated(data: {
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
  handicap: number;
  kickoff: string;
}): Promise<void> {
  await sendTelegramMessage(formatMatchCreatedMessage(data));
}

export async function notifyUserPredicted(data: {
  userName: string;
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
}): Promise<void> {
  await sendTelegramMessage(formatPredictedMessage(data));
}

export async function notifyVotingClosed(data: {
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
  handicap: number;
  stats: Record<Choice, string[]>;
  notChosen: string[];
}): Promise<void> {
  await sendTelegramMessage(formatVotingClosedMessage(data));
}

export function formatMatchSettledMessage(data: {
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
  handicap: number;
  homeScore: number;
  awayScore: number;
  handicapResult: HandicapResult;
  contributions: Array<{
    userName: string;
    choice: Choice | null;
    contribution: number;
  }>;
}): string {
  const line = formatHandicapLine(data.homeTeam, data.awayTeam, data.handicap);
  const winner =
    data.handicapResult === "HOME"
      ? escapeHtml(data.homeTeam)
      : data.handicapResult === "AWAY"
        ? escapeHtml(data.awayTeam)
        : "HÒA kèo";
  const totalContribution = data.contributions.reduce(
    (sum, row) => sum + row.contribution,
    0
  );
  const contributionLines = data.contributions
    .slice()
    .sort((a, b) => a.userName.localeCompare(b.userName, "vi"))
    .map((row) => {
      const choiceText = row.choice ? choiceLabels[row.choice] : "Không dự đoán";
      const amountText = row.contribution === 0 ? "0" : `-${row.contribution}`;
      return `• ${escapeHtml(row.userName)}: ${amountText} (${choiceText})`;
    })
    .join("\n");

  return (
    `🏁 <b>Kết quả trận</b>\n` +
    `Trận #${data.matchStt}: ${escapeHtml(data.homeTeam)} vs ${escapeHtml(data.awayTeam)}\n` +
    `Tỉ số: <b>${data.homeScore}-${data.awayScore}</b>\n` +
    `Kèo: ${escapeHtml(line)}\n` +
    `Thắng kèo: <b>${winner}</b> (${choiceLabels[data.handicapResult]})\n\n` +
    `📋 <b>Đóng góp theo thành viên</b>\n` +
    `${contributionLines || "—"}\n\n` +
    `Tổng đóng góp trận: <b>${totalContribution}</b>`
  );
}

export async function notifyMatchSettled(data: {
  matchStt: number;
  homeTeam: string;
  awayTeam: string;
  handicap: number;
  homeScore: number;
  awayScore: number;
  handicapResult: HandicapResult;
  contributions: Array<{
    userName: string;
    choice: Choice | null;
    contribution: number;
  }>;
}): Promise<void> {
  await sendTelegramMessage(formatMatchSettledMessage(data));
}

function formatList(names: string[]): string {
  if (names.length === 0) return "—";
  return names.map(escapeHtml).join(", ");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
