import { config } from "dotenv";
config({ path: ".env.local" });

import { ensureSheetHeaders, seedUsers } from "../src/lib/sheets";

const USERS = [
  { stt: 1, fullName: "Phan Viet Linh", title: "admin" as const, sdt: "0914937339" },
  { stt: 2, fullName: "Vu Ba Liem", title: "user" as const, sdt: "0933955739" },
  { stt: 3, fullName: "Le Van Khang", title: "user" as const, sdt: "0913616174" },
  { stt: 4, fullName: "Nguyen Huynh Khuong", title: "user" as const, sdt: "0909174080" },
  { stt: 5, fullName: "Tran Dinh Tu", title: "user" as const, sdt: "0908257297" },
  { stt: 6, fullName: "Pham Ngoc Duy", title: "user" as const, sdt: "0934973585" },
  { stt: 7, fullName: "Le Huu Phuc", title: "user" as const, sdt: "0914662097" },
  { stt: 8, fullName: "Truong Hoang Du", title: "user" as const, sdt: "0909477341" },
  { stt: 9, fullName: "Huynh Van Thanh Huyen", title: "user" as const, sdt: "0973313381" },
  { stt: 10, fullName: "Duong Thanh Liem", title: "user" as const, sdt: "0937357286" },
  { stt: 11, fullName: "Nguyen Xuan Son", title: "user" as const, sdt: "0988123978" },
  { stt: 12, fullName: "Mai Hung Cuong", title: "user" as const, sdt: "0797067879" },
  { stt: 13, fullName: "Le Minh Thang", title: "user" as const, sdt: "0919841122" },
  { stt: 14, fullName: "Nguyen Ngoc Tien", title: "user" as const, sdt: "0946428478" },
];

async function main() {
  console.log("Setting up sheet headers...");
  await ensureSheetHeaders();
  console.log("Seeding users...");
  await seedUsers(USERS);
  console.log("Done! 14 users seeded.");
  USERS.forEach((u) => console.log(`  ${u.stt}. ${u.fullName} - ${u.sdt} (${u.title})`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
