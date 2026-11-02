/**
 * Telefon numarasını WhatsApp'ın kullandığı biçime çevirir: ülke kodu + numara, sadece rakam.
 * "0532 123 45 67", "+90 532 123 45 67", "905321234567" → "905321234567"
 */
export function normalizePhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = `90${d.slice(1)}`; // 0532...
  if (d.length === 10 && d.startsWith("5")) d = `90${d}`; // 532...
  return d;
}
