/**
 * উখিয়ার সরকারি চাকরিজীবী — shared types & constants.
 * Self-contained module: nothing outside `govt-*` imports this file.
 */

export type GovtWorkerStatus = "pending" | "approved" | "rejected" | "hidden";
export type GovtPhoneVisibility = "public" | "members" | "hidden";
export type GovtReportStatus = "open" | "reviewed" | "dismissed";

/** Publicly readable shape — contact columns are NOT part of it. */
export type GovtWorker = {
  id: string;
  user_id: string;
  full_name: string;
  photo_url: string | null;
  designation: string;
  organization: string;
  department: string;
  job_category: string | null;
  current_workplace: string | null;
  current_district: string;
  current_upazila: string | null;
  ukhiya_area: string;
  joining_year: number | null;
  bio: string | null;
  tips_for_younger: string | null;
  phone_visibility: GovtPhoneVisibility;
  consent_given: boolean;
  status: GovtWorkerStatus;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GovtWorkerWithContact = GovtWorker & {
  phone: string | null;
  whatsapp: string | null;
  official_email: string | null;
  admin_note: string | null;
};

/** Columns granted to anon/authenticated. Contact columns have no grant at all. */
export const GOVT_PUBLIC_COLUMNS =
  "id, user_id, full_name, photo_url, designation, organization, department, job_category, current_workplace, current_district, current_upazila, ukhiya_area, joining_year, bio, tips_for_younger, phone_visibility, consent_given, status, is_verified, verified_at, created_at, updated_at";

export const GOVT_DEPARTMENTS = [
  "প্রশাসন",
  "পুলিশ",
  "শিক্ষা",
  "স্বাস্থ্য",
  "ভূমি",
  "কৃষি",
  "সমাজসেবা",
  "মৎস্য",
  "প্রাণিসম্পদ",
  "বন",
  "নির্বাচন",
  "খাদ্য",
  "স্থানীয় সরকার",
  "দুর্যোগ ব্যবস্থাপনা",
  "বিদ্যুৎ",
  "অন্যান্য",
] as const;

export const GOVT_DISTRICT_FILTERS = ["উখিয়া", "কক্সবাজার", "চট্টগ্রাম", "ঢাকা", "অন্যান্য"] as const;

export const UKHIYA_AREAS = [
  "রাজাপালং",
  "জালিয়াপালং",
  "হলদিয়াপালং",
  "রত্নাপালং",
  "পালংখালী",
  "অন্যান্য",
] as const;

/** Job categories are suggestions — the field accepts any free text. */
export const GOVT_JOB_CATEGORY_SUGGESTIONS = [
  "প্রথম শ্রেণি (ক্যাডার)",
  "প্রথম শ্রেণি (নন-ক্যাডার)",
  "দ্বিতীয় শ্রেণি",
  "তৃতীয় শ্রেণি",
  "চতুর্থ শ্রেণি",
  "সামরিক বাহিনী",
  "আধা-সরকারি / স্বায়ত্তশাসিত",
  "প্রকল্পভিত্তিক",
  "অন্যান্য",
] as const;

export const GOVT_STATUS_META: Record<GovtWorkerStatus, { label: string; className: string }> = {
  pending: { label: "যাচাই অপেক্ষমাণ", className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  approved: { label: "অনুমোদিত", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  rejected: { label: "প্রত্যাখ্যাত", className: "border-destructive/40 bg-destructive/10 text-destructive" },
  hidden: { label: "লুকানো", className: "border-muted-foreground/40 bg-muted text-muted-foreground" },
};

export const GOVT_PHONE_VISIBILITY_META: Record<GovtPhoneVisibility, { label: string; hint: string }> = {
  public: { label: "সবাই দেখতে পারবে", hint: "যে কেউ আপনার নম্বরে কল করতে পারবেন।" },
  members: { label: "শুধু লগইন করা ব্যবহারকারী দেখতে পারবে", hint: "সাইন ইন করা ব্যবহারকারীরাই নম্বর দেখতে পারবেন।" },
  hidden: { label: "মোবাইল নম্বর প্রকাশ করতে চাই না", hint: "আপনার নম্বর কারও কাছে প্রকাশ করা হবে না।" },
};

export const GOVT_REPORT_REASONS = [
  "ভুল পরিচয়",
  "ভুল চাকরির তথ্য",
  "ভুয়া প্রোফাইল",
  "ব্যক্তিগত তথ্যের অপব্যবহার",
  "অন্যান্য",
] as const;

export const GOVT_REPORT_STATUS_META: Record<GovtReportStatus, { label: string; className: string }> = {
  open: { label: "নতুন", className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  reviewed: { label: "পর্যালোচিত", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  dismissed: { label: "বাতিল", className: "border-muted-foreground/40 bg-muted text-muted-foreground" },
};

export const GOVT_DISCLAIMER =
  "এই ডিরেক্টরিটি Khijirion-এর একটি কমিউনিটি উদ্যোগ। এটি কোনো সরকারি প্রতিষ্ঠানের অফিসিয়াল ডিরেক্টরি নয়।";

export const GOVT_PAGE_SIZE = 12;

/** Character limits for the two optional public free-text fields. */
export const GOVT_BIO_MAX = 800;
export const GOVT_TIPS_MAX = 1200;

/** Normalise a Bangladeshi/international mobile number to a dialable form. */
export function normalizeGovtPhone(input: string): string {
  const raw = input.replace(/[^\d+]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return `+${raw.slice(2)}`;
  if (raw.startsWith("880")) return `+${raw}`;
  if (raw.startsWith("01") && raw.length === 11) return `+88${raw}`;
  return raw;
}
