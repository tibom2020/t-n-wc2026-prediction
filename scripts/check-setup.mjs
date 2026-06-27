import fs from "fs";
import { google } from "googleapis";

const json = JSON.parse(
  fs.readFileSync("gen-lang-client-0283118819-09303e19b963.json", "utf8")
);
const envText = fs.readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const envKey = env.GOOGLE_PRIVATE_KEY?.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

console.log("=== So khop .env.local vs JSON ===");
console.log("Email:", env.GOOGLE_SERVICE_ACCOUNT_EMAIL === json.client_email ? "OK" : "SAI");
console.log("Private key:", envKey === json.private_key ? "OK" : "SAI");
console.log("Spreadsheet ID:", env.GOOGLE_SPREADSHEET_ID ? "Co" : "Thieu");
console.log("SESSION_SECRET:", (env.SESSION_SECRET?.length ?? 0) >= 32 ? "OK" : "Qua ngan");

console.log("\n=== Test ket noi Google Sheets ===");
try {
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: envKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
  });
  const titles = meta.data.sheets?.map((s) => s.properties?.title) ?? [];
  console.log("Ket noi: OK");
  console.log("Ten spreadsheet:", meta.data.properties?.title);
  console.log("Cac sheet:", titles.join(", "));
  const required = ["Users", "Matches", "Predictions"];
  const missing = required.filter((s) => !titles.includes(s));
  if (missing.length) {
    console.log("Thieu sheet:", missing.join(", "));
  } else {
    console.log("Sheet Users/Matches/Predictions: OK");
  }
  const users = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
    range: "Users!A1:D3",
  });
  console.log("Users header:", users.data.values?.[0]?.join(" | "));
  console.log("So user (row 2+):", Math.max(0, (users.data.values?.length ?? 1) - 1));
} catch (e) {
  console.log("Ket noi: LOI");
  console.log(e.message);
  if (e.message?.includes("permission") || e.code === 403) {
    console.log("-> Hay share spreadsheet cho:", json.client_email);
  }
}
