/**
 * KHIJIRION Match — shared types, constants & labels.
 * Self-contained: only `match-*` modules import this file.
 */

export const MATCH_BRAND = "KHIJIRION Match";
export const MATCH_TAGLINE = "সঠিক মানুষের সন্ধানে";

export type MatchLookingFor = "groom" | "bride";
export type MatchCreatedFor = "self" | "guardian";
export type MatchMaritalStatus = "unmarried" | "divorced" | "widowed";
export type MatchRequestStatus = "pending" | "approved" | "rejected" | "hidden";
export type MatchInterestStatus = "pending" | "accepted" | "declined" | "withdrawn";

/** Publicly readable shape — contact columns are NOT part of it. */
export type MatchRequest = {
  id: string;
  user_id: string;
  display_name: string;
  looking_for: MatchLookingFor;
  created_for: MatchCreatedFor;
  age_min: number;
  age_max: number;
  area: string;
  education: string | null;
  profession: string | null;
  marital_status: MatchMaritalStatus;
  height_cm: number | null;
  family_info: string | null;
  expectations: string | null;
  photo_url: string | null;
  status: MatchRequestStatus;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type MatchRequestWithContact = MatchRequest & {
  contact_name: string | null;
  contact_phone: string;
  admin_note: string | null;
};

export type MatchInterest = {
  id: string;
  request_id: string;
  sender_id: string;
  sender_name: string;
  sender_phone: string;
  message: string | null;
  status: MatchInterestStatus;
  created_at: string;
  updated_at: string;
};

/** Columns granted to anon/authenticated. Contact columns have no grant at all. */
export const MATCH_PUBLIC_COLUMNS =
  "id, user_id, display_name, looking_for, created_for, age_min, age_max, area, education, profession, marital_status, height_cm, family_info, expectations, photo_url, status, is_verified, created_at, updated_at";

export const LOOKING_FOR_LABEL: Record<MatchLookingFor, string> = {
  groom: "পাত্র",
  bride: "পাত্রী",
};

export const CREATED_FOR_LABEL: Record<MatchCreatedFor, string> = {
  self: "নিজের জন্য",
  guardian: "অভিভাবকের জন্য",
};

export const MARITAL_LABEL: Record<MatchMaritalStatus, string> = {
  unmarried: "অবিবাহিত",
  divorced: "তালাকপ্রাপ্ত",
  widowed: "বিধবা / বিপত্নীক",
};

export const MATCH_STATUS_META: Record<
  MatchRequestStatus,
  { label: string; className: string }
> = {
  pending: { label: "যাচাই অপেক্ষমাণ", className: "bg-amber-500/10 text-amber-600" },
  approved: { label: "প্রকাশিত", className: "bg-emerald-500/10 text-emerald-600" },
  rejected: { label: "প্রত্যাখ্যাত", className: "bg-destructive/10 text-destructive" },
  hidden: { label: "লুকানো", className: "bg-muted text-muted-foreground" },
};

export const INTEREST_STATUS_META: Record<
  MatchInterestStatus,
  { label: string; className: string }
> = {
  pending: { label: "অপেক্ষমাণ", className: "bg-amber-500/10 text-amber-600" },
  accepted: { label: "গৃহীত", className: "bg-emerald-500/10 text-emerald-600" },
  declined: { label: "প্রত্যাখ্যাত", className: "bg-destructive/10 text-destructive" },
  withdrawn: { label: "প্রত্যাহৃত", className: "bg-muted text-muted-foreground" },
};

export const MATCH_AREAS = [
  "উখিয়া",
  "টেকনাফ",
  "কক্সবাজার সদর",
  "রামু",
  "চকরিয়া",
  "পেকুয়া",
  "মহেশখালী",
  "কুতুবদিয়া",
  "চট্টগ্রাম",
  "অন্যান্য",
] as const;

export const MATCH_EDUCATION_OPTIONS = [
  "প্রাথমিক",
  "মাধ্যমিক (SSC)",
  "উচ্চ মাধ্যমিক (HSC)",
  "স্নাতক",
  "স্নাতকোত্তর",
  "দাখিল",
  "আলিম",
  "ফাজিল",
  "কামিল",
  "হাফেজ / আলেম",
  "অন্যান্য",
] as const;

export const MATCH_DISCLAIMER =
  "KHIJIRION Match শুধুমাত্র পরিবারভিত্তিক পরিচয় করিয়ে দেওয়ার একটি মাধ্যম। যোগাযোগের আগে নিজ দায়িত্বে সব তথ্য যাচাই করে নিন।";

export const MATCH_PAGE_SIZE = 12;

/** Normalizes a Bangladeshi phone number to a compact form. */
export function normalizeMatchPhone(input: string): string {
  return input.replace(/[^\d+]/g, "");
}

export function ageRangeLabel(min: number, max: number, toBn: (v: string | number) => string) {
  return `${toBn(min)}–${toBn(max)} বছর`;
}
