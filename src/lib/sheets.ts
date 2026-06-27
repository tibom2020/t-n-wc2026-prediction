import { google } from "googleapis";
import type { Match, MatchStatus, Prediction, User, HandicapResult, Choice } from "@/types";
import { parseHandicap } from "@/lib/utils";

const USERS_SHEET = "Users";
const MATCHES_SHEET = "Matches";
const PREDICTIONS_SHEET = "Predictions";

const SHEET_HEADERS: Record<string, string[]> = {
  [USERS_SHEET]: ["stt", "fullName", "title", "sdt"],
  [MATCHES_SHEET]: [
    "matchId", "homeTeam", "awayTeam", "handicap", "kickoff",
    "homeScore", "awayScore", "status", "handicapResult", "createdAt", "stt",
    "votingClosedNotified",
  ],
  [PREDICTIONS_SHEET]: [
    "predictionId", "matchId", "userStt", "userName", "choice", "contribution", "createdAt",
  ],
};

let sheetsReady: Promise<void> | null = null;

async function ensureSheetsReady(): Promise<void> {
  const client = sheetsClient();
  const id = spreadsheetId();

  const meta = await client.spreadsheets.get({ spreadsheetId: id });
  const existing = new Set(
    meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[]
  );

  const missing = Object.keys(SHEET_HEADERS).filter((name) => !existing.has(name));
  if (missing.length > 0) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
  }

  for (const [sheet, headers] of Object.entries(SHEET_HEADERS)) {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${sheet}!A1:1`,
    });
    if (res.data.values?.[0]?.[0] !== headers[0]) {
      await client.spreadsheets.values.update({
        spreadsheetId: id,
        range: `${sheet}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
  }
}

function ensureSheetsReadyOnce(): Promise<void> {
  if (!sheetsReady) {
    sheetsReady = ensureSheetsReady().catch((e) => {
      sheetsReady = null;
      throw e;
    });
  }
  return sheetsReady;
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!email || !key || !spreadsheetId) {
    throw new Error("Google Sheets credentials not configured");
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return { auth, spreadsheetId };
}

function sheetsClient() {
  const { auth } = getAuth();
  return google.sheets({ version: "v4", auth });
}

function spreadsheetId() {
  return getAuth().spreadsheetId;
}

// --- Users ---
export async function getUsers(): Promise<User[]> {
  await ensureSheetsReadyOnce();
  const res = await sheetsClient().spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${USERS_SHEET}!A2:D`,
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({
    stt: Number(r[0]),
    fullName: r[1] || "",
    title: (r[2] || "user") as User["title"],
    sdt: String(r[3] || ""),
  }));
}

export async function findUserBySdt(sdt: string): Promise<User | null> {
  const { normalizePhone } = await import("@/lib/normalize");
  const normalized = normalizePhone(sdt);
  const users = await getUsers();
  return users.find((u) => normalizePhone(u.sdt) === normalized) || null;
}

export async function seedUsers(users: User[]): Promise<void> {
  await ensureSheetsReadyOnce();
  const values = users.map((u) => [u.stt, u.fullName, u.title, u.sdt]);
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${USERS_SHEET}!A2:D${values.length + 1}`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

export async function ensureSheetHeaders(): Promise<void> {
  sheetsReady = null;
  await ensureSheetsReady();
}

// --- Matches ---
function rowToMatch(r: string[]): Match {
  return {
    matchId: r[0] || "",
    stt: r[10] ? Number(r[10]) : 0,
    homeTeam: r[1] || "",
    awayTeam: r[2] || "",
    handicap: parseHandicap(r[3]),
    kickoff: r[4] || "",
    homeScore: r[5] !== "" && r[5] != null ? Number(r[5]) : null,
    awayScore: r[6] !== "" && r[6] != null ? Number(r[6]) : null,
    status: (r[7] || "open") as MatchStatus,
    handicapResult: r[8] ? (r[8] as HandicapResult) : null,
    createdAt: r[9] || "",
    votingClosedNotified: r[11] === "true",
  };
}

export async function getMatches(): Promise<Match[]> {
  await ensureSheetsReadyOnce();
  const res = await sheetsClient().spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${MATCHES_SHEET}!A2:L`,
  });
  const rows = (res.data.values || []).filter((r) => r[0]);
  let matches = rows.map(rowToMatch);

  const missing = matches.filter((m) => !m.stt);
  if (missing.length > 0) {
    const maxStt = Math.max(0, ...matches.map((m) => m.stt));
    let next = maxStt;
    const sorted = [...missing].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    for (const m of sorted) {
      next += 1;
      m.stt = next;
      const rowIdx = rows.findIndex((r) => r[0] === m.matchId) + 2;
      await sheetsClient().spreadsheets.values.update({
        spreadsheetId: spreadsheetId(),
        range: `${MATCHES_SHEET}!K${rowIdx}`,
        valueInputOption: "RAW",
        requestBody: { values: [[next]] },
      });
    }
  }

  return matches.sort((a, b) => a.stt - b.stt);
}

async function getNextMatchStt(): Promise<number> {
  const res = await sheetsClient().spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${MATCHES_SHEET}!K2:K`,
  });
  const values = (res.data.values || []).map((r) => Number(r[0])).filter((n) => !Number.isNaN(n) && n > 0);
  return values.length === 0 ? 1 : Math.max(...values) + 1;
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const matches = await getMatches();
  return matches.find((m) => m.matchId === matchId) || null;
}

export async function createMatch(data: {
  homeTeam: string;
  awayTeam: string;
  handicap: number;
  kickoff: string;
}): Promise<Match> {
  await ensureSheetsReadyOnce();
  const { v4: uuidv4 } = await import("uuid");
  const stt = await getNextMatchStt();
  const match: Match = {
    matchId: uuidv4(),
    stt,
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    handicap: data.handicap,
    kickoff: data.kickoff,
    homeScore: null,
    awayScore: null,
    status: "open",
    handicapResult: null,
    createdAt: new Date().toISOString(),
    votingClosedNotified: false,
  };
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${MATCHES_SHEET}!A:L`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        match.matchId, match.homeTeam, match.awayTeam, String(match.handicap),
        match.kickoff, "", "", match.status, "", match.createdAt, match.stt, "",
      ]],
    },
  });
  return match;
}

export async function updateMatchStatus(matchId: string, status: MatchStatus): Promise<void> {
  const matches = await getMatches();
  const idx = matches.findIndex((m) => m.matchId === matchId);
  if (idx === -1) throw new Error("Match not found");
  const row = idx + 2;
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${MATCHES_SHEET}!H${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
}

export async function settleMatch(
  matchId: string,
  homeScore: number,
  awayScore: number,
  handicapResult: HandicapResult
): Promise<void> {
  const matches = await getMatches();
  const idx = matches.findIndex((m) => m.matchId === matchId);
  if (idx === -1) throw new Error("Match not found");
  const row = idx + 2;
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${MATCHES_SHEET}!F${row}:I${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[homeScore, awayScore, "settled", handicapResult]] },
  });
}

export async function closeMatchVoting(matchId: string): Promise<void> {
  const matches = await getMatches();
  const idx = matches.findIndex((m) => m.matchId === matchId);
  if (idx === -1) throw new Error("Match not found");
  const row = idx + 2;
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${MATCHES_SHEET}!H${row}:H${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [["closed"]] },
  });
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${MATCHES_SHEET}!L${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [["true"]] },
  });
}

// --- Predictions ---
function rowToPrediction(r: string[]): Prediction {
  const rawChoice = r[4]?.trim();
  const choice =
    rawChoice === "HOME" || rawChoice === "AWAY" || rawChoice === "DRAW"
      ? rawChoice
      : null;
  return {
    predictionId: r[0] || "",
    matchId: r[1] || "",
    userStt: Number(r[2]),
    userName: r[3] || "",
    choice,
    contribution: r[5] !== "" && r[5] != null ? Number(r[5]) : null,
    createdAt: r[6] || "",
  };
}

export async function getPredictions(): Promise<Prediction[]> {
  await ensureSheetsReadyOnce();
  const res = await sheetsClient().spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${PREDICTIONS_SHEET}!A2:G`,
  });
  return (res.data.values || []).filter((r) => r[0]).map(rowToPrediction);
}

export async function getPredictionsByUser(userStt: number): Promise<Prediction[]> {
  return (await getPredictions()).filter((p) => p.userStt === userStt);
}

export async function getPredictionByUserAndMatch(
  userStt: number,
  matchId: string
): Promise<Prediction | null> {
  return (await getPredictions()).find(
    (p) => p.userStt === userStt && p.matchId === matchId
  ) || null;
}

export async function createPrediction(data: {
  matchId: string;
  userStt: number;
  userName: string;
  choice: Choice;
}): Promise<Prediction> {
  await ensureSheetsReadyOnce();
  const { v4: uuidv4 } = await import("uuid");
  const prediction: Prediction = {
    predictionId: uuidv4(),
    matchId: data.matchId,
    userStt: data.userStt,
    userName: data.userName,
    choice: data.choice,
    contribution: null,
    createdAt: new Date().toISOString(),
  };
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${PREDICTIONS_SHEET}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        prediction.predictionId, prediction.matchId, prediction.userStt,
        prediction.userName, prediction.choice, "", prediction.createdAt,
      ]],
    },
  });
  return prediction;
}

export async function createMissedPrediction(data: {
  matchId: string;
  userStt: number;
  userName: string;
  contribution: number;
}): Promise<Prediction> {
  await ensureSheetsReadyOnce();
  const { v4: uuidv4 } = await import("uuid");
  const prediction: Prediction = {
    predictionId: uuidv4(),
    matchId: data.matchId,
    userStt: data.userStt,
    userName: data.userName,
    choice: null,
    contribution: data.contribution,
    createdAt: new Date().toISOString(),
  };
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${PREDICTIONS_SHEET}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        prediction.predictionId, prediction.matchId, prediction.userStt,
        prediction.userName, "", data.contribution, prediction.createdAt,
      ]],
    },
  });
  return prediction;
}

export async function updatePredictionChoice(
  predictionId: string,
  choice: Choice
): Promise<void> {
  const predictions = await getPredictions();
  const idx = predictions.findIndex((p) => p.predictionId === predictionId);
  if (idx === -1) throw new Error("Prediction not found");
  const row = idx + 2;
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${PREDICTIONS_SHEET}!E${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[choice]] },
  });
}

export async function updatePredictionContribution(
  predictionId: string,
  contribution: number
): Promise<void> {
  const predictions = await getPredictions();
  const idx = predictions.findIndex((p) => p.predictionId === predictionId);
  if (idx === -1) throw new Error("Prediction not found");
  const row = idx + 2;
  await sheetsClient().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${PREDICTIONS_SHEET}!F${row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[contribution]] },
  });
}

