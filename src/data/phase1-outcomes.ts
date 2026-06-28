import type { UserOutcomeTotal } from "@/lib/prediction-outcome";

/** Số liệu tổng kết đợt 1 (Win, Hòa, Lose) — khóa theo STT user trong hệ thống */
export const PHASE1_OUTCOME_ROWS: UserOutcomeTotal[] = [
  { userStt: 1, userName: "Phan Viet Linh", win: 28, draw: 5, lose: 15 },
  { userStt: 2, userName: "Vu Ba Liem", win: 19, draw: 3, lose: 26 },
  { userStt: 3, userName: "Le Van Khang", win: 25, draw: 4, lose: 19 },
  { userStt: 4, userName: "Nguyen Huynh Khuong", win: 15, draw: 4, lose: 29 },
  { userStt: 5, userName: "Tran Dinh Tu", win: 24, draw: 4, lose: 20 },
  { userStt: 6, userName: "Pham Ngoc Duy", win: 21, draw: 5, lose: 22 },
  { userStt: 7, userName: "Le Huu Phuc", win: 21, draw: 5, lose: 22 },
  { userStt: 8, userName: "Truong Hoang Du", win: 22, draw: 5, lose: 21 },
  { userStt: 10, userName: "Duong Thanh Liem", win: 26, draw: 5, lose: 17 },
  { userStt: 11, userName: "Nguyen Xuan Son", win: 22, draw: 5, lose: 21 },
  { userStt: 12, userName: "Mai Hung Cuong", win: 12, draw: 5, lose: 31 },
  { userStt: 13, userName: "Le Minh Thang", win: 19, draw: 5, lose: 24 },
  { userStt: 14, userName: "Nguyen Ngoc Tien", win: 1, draw: 1, lose: 2 },
  { userStt: 15, userName: "Dang Minh Tuan", win: 21, draw: 5, lose: 22 },
];
