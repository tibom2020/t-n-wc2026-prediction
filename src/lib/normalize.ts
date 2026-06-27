export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }
  if (digits.length === 9) {
    return `0${digits}`;
  }
  return digits;
}
