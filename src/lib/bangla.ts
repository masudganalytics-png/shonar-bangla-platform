/**
 * Convert Western digits in a string to Bangla digits.
 * Non-digit characters are preserved.
 */
const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)]);
}

/** Format a number as Bangla currency (৳ prefix, 2 decimals). */
export function formatBanglaCurrency(value: number): string {
  const fixed = Number.isFinite(value) ? value.toFixed(2) : "0.00";
  return `৳ ${toBanglaDigits(fixed)}`;
}

const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

/** Format an ISO date string / Date as `৫ জুলাই, ২০২৬`. */
export function formatBanglaDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  const day = toBanglaDigits(d.getDate());
  const month = BN_MONTHS[d.getMonth()];
  const year = toBanglaDigits(d.getFullYear());
  return `${day} ${month}, ${year}`;
}
