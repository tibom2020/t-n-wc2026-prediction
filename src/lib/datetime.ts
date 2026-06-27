const TZ = "Asia/Ho_Chi_Minh";

/** datetime-local value treated as GMT+7 */
export function parseDatetimeLocalAsGMT7(value: string): string {
  if (!value) return "";
  const normalized = value.length === 16 ? `${value}:00` : value;
  return `${normalized}+07:00`;
}

export function formatGMT7(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("vi-VN", { timeZone: TZ });
}

export function isPastDeadline(deadline: string): boolean {
  if (!deadline) return false;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() >= date.getTime();
}
