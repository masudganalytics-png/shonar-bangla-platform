/**
 * Probashi Corner — shared types, constants and date calculations.
 * Fully self-contained: no existing module imports this file.
 */
import { toBanglaDigits } from "@/lib/bangla";

export type ProbashiStatus = "pending" | "approved" | "rejected" | "suspended";

export type ProbashiProfile = {
  id: string;
  slug: string | null;
  full_name: string;
  photo_url: string | null;
  birth_date: string | null;
  country: string;
  country_code: string | null;
  city: string | null;
  village: string | null;
  profession: string | null;
  moved_abroad_date: string | null;
  expected_return_date: string | null;
  facebook_url: string | null;
  community_message: string | null;
  show_contact: boolean;
  is_verified: boolean;
  status: ProbashiStatus;
  created_at: string;
  updated_at: string;
};

/** Columns readable by visitors — phone/whatsapp/facebook_url are contact fields
 *  released only through `getProbashiContact`, which honours `show_contact`. */
export const PROBASHI_PUBLIC_COLUMNS =
  "id, slug, full_name, photo_url, birth_date, country, country_code, city, village, profession, moved_abroad_date, expected_return_date, community_message, show_contact, is_verified, status, created_at, updated_at";

export const PROBASHI_COUNTRIES: ReadonlyArray<{ name: string; bn: string; iso: string }> = [
  { name: "Saudi Arabia", bn: "সৌদি আরব", iso: "SA" },
  { name: "United Arab Emirates", bn: "সংযুক্ত আরব আমিরাত", iso: "AE" },
  { name: "Qatar", bn: "কাতার", iso: "QA" },
  { name: "Oman", bn: "ওমান", iso: "OM" },
  { name: "Kuwait", bn: "কুয়েত", iso: "KW" },
  { name: "Bahrain", bn: "বাহরাইন", iso: "BH" },
  { name: "Malaysia", bn: "মালয়েশিয়া", iso: "MY" },
  { name: "Singapore", bn: "সিঙ্গাপুর", iso: "SG" },
  { name: "United States", bn: "যুক্তরাষ্ট্র", iso: "US" },
  { name: "United Kingdom", bn: "যুক্তরাজ্য", iso: "GB" },
  { name: "Italy", bn: "ইতালি", iso: "IT" },
  { name: "France", bn: "ফ্রান্স", iso: "FR" },
  { name: "Spain", bn: "স্পেন", iso: "ES" },
  { name: "Portugal", bn: "পর্তুগাল", iso: "PT" },
  { name: "Germany", bn: "জার্মানি", iso: "DE" },
  { name: "South Korea", bn: "দক্ষিণ কোরিয়া", iso: "KR" },
  { name: "Japan", bn: "জাপান", iso: "JP" },
  { name: "Australia", bn: "অস্ট্রেলিয়া", iso: "AU" },
  { name: "Canada", bn: "কানাডা", iso: "CA" },
  { name: "Maldives", bn: "মালদ্বীপ", iso: "MV" },
  { name: "Jordan", bn: "জর্ডান", iso: "JO" },
  { name: "Lebanon", bn: "লেবানন", iso: "LB" },
  { name: "Libya", bn: "লিবিয়া", iso: "LY" },
  { name: "South Africa", bn: "দক্ষিণ আফ্রিকা", iso: "ZA" },
  { name: "Brunei", bn: "ব্রুনাই", iso: "BN" },
  { name: "Other", bn: "অন্যান্য", iso: "UN" },
];

export const UKHIYA_UNIONS_PROBASHI = [
  "রাজাপালং",
  "জালিয়াপালং",
  "হলদিয়াপালং",
  "রত্নাপালং",
  "পালংখালী",
  "অন্যান্য",
] as const;

export function countryMeta(country: string | null | undefined) {
  const hit = PROBASHI_COUNTRIES.find((c) => c.name === country || c.bn === country);
  return hit ?? { name: country ?? "—", bn: country ?? "—", iso: "UN" };
}

export function countryLabel(country: string | null | undefined): string {
  return countryMeta(country).bn;
}

/* ---------------------------------------------------------------- dates */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's calendar date in Asia/Dhaka, as a UTC-midnight Date (timezone-safe compare). */
export function todayInDhaka(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${parts}T00:00:00Z`);
}

/** Stable key that changes once per Dhaka day — used to refresh calculations daily. */
export function dhakaDayKey(now: Date = new Date()): string {
  return todayInDhaka(now).toISOString().slice(0, 10);
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function calcAge(birthDate: string | null | undefined, today = todayInDhaka()): number | null {
  const b = parseDate(birthDate);
  if (!b) return null;
  let age = today.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < b.getUTCMonth() ||
    (today.getUTCMonth() === b.getUTCMonth() && today.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Whole days spent abroad since `moved_abroad_date`. */
export function daysAbroad(movedAbroad: string | null | undefined, today = todayInDhaka()): number | null {
  const m = parseDate(movedAbroad);
  if (!m) return null;
  const d = diffDays(m, today);
  return d >= 0 ? d : 0;
}

/** Days left until the expected return date. Negative once the date has passed. */
export function daysUntilReturn(expectedReturn: string | null | undefined, today = todayInDhaka()): number | null {
  const r = parseDate(expectedReturn);
  if (!r) return null;
  return diffDays(today, r);
}

export type Presence = "abroad" | "home";

/**
 * Presence is derived, never stored — so it is always correct without a nightly job.
 * A profile counts as "home" once the expected return date has passed, unless the
 * member has since recorded a newer departure date.
 */
export function presenceOf(
  p: Pick<ProbashiProfile, "moved_abroad_date" | "expected_return_date">,
  today = todayInDhaka(),
): Presence {
  const moved = parseDate(p.moved_abroad_date);
  const ret = parseDate(p.expected_return_date);
  if (!ret) return "abroad";
  if (ret.getTime() > today.getTime()) return "abroad";
  // Return date passed — back home, unless a later departure was recorded.
  if (moved && moved.getTime() > ret.getTime()) return "abroad";
  return "home";
}

export const PRESENCE_META: Record<Presence, { label: string; emoji: string; className: string }> = {
  abroad: {
    label: "বর্তমানে প্রবাসে",
    emoji: "🟢",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  home: {
    label: "বর্তমানে বাংলাদেশে",
    emoji: "🏡",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
};

export const PROBASHI_STATUS_META: Record<ProbashiStatus, { label: string; className: string }> = {
  pending: { label: "অপেক্ষমাণ", className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  approved: { label: "অনুমোদিত", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  rejected: { label: "প্রত্যাখ্যাত", className: "border-destructive/40 bg-destructive/10 text-destructive" },
  suspended: { label: "স্থগিত", className: "border-muted-foreground/40 bg-muted text-muted-foreground" },
};

/** "৩ বছর ২ মাস" style duration from a day count. */
export function formatDuration(days: number | null): string {
  if (days === null) return "—";
  if (days < 30) return `${toBanglaDigits(days)} দিন`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years <= 0) return `${toBanglaDigits(months)} মাস`;
  return months > 0 ? `${toBanglaDigits(years)} বছর ${toBanglaDigits(months)} মাস` : `${toBanglaDigits(years)} বছর`;
}

export function formatDaysRemaining(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return "ফিরে এসেছেন";
  if (days === 0) return "আজই ফিরছেন";
  return `${toBanglaDigits(days)} দিন বাকি`;
}

export function isBirthdayToday(birthDate: string | null | undefined, today = todayInDhaka()): boolean {
  const b = parseDate(birthDate);
  if (!b) return false;
  return b.getUTCMonth() === today.getUTCMonth() && b.getUTCDate() === today.getUTCDate();
}

/** Deterministic index that rotates once every 24 hours (Dhaka time). */
export function dailyRotationIndex(count: number, now: Date = new Date()): number {
  if (count <= 0) return 0;
  const epochDay = Math.floor(todayInDhaka(now).getTime() / DAY_MS);
  return epochDay % count;
}

export function normalizeProbashiPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? `+${digits.slice(1).replace(/\D/g, "")}` : digits;
}

export function probashiProfilePath(p: Pick<ProbashiProfile, "id" | "slug">): string {
  return `/probashi/${p.slug || p.id}`;
}

export { toBanglaDigits };
