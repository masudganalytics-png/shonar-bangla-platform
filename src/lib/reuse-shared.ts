/**
 * KHIJIRION Reuse — shared types & constants.
 * Self-contained: only `reuse-*` modules import this file.
 */

export type ReuseListingType = "sale" | "donation";
export type ReuseStatus = "pending" | "approved" | "rejected" | "sold" | "donated" | "hidden";

/** Publicly readable shape — phone / whatsapp are NOT part of it. */
export type ReuseListing = {
  id: string;
  user_id: string;
  listing_type: ReuseListingType;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  price: number | null;
  location: string;
  area: string | null;
  image_url: string | null;
  status: ReuseStatus;
  created_at: string;
  updated_at: string;
};

export type ReuseListingWithContact = ReuseListing & {
  phone: string | null;
  whatsapp: string | null;
  admin_note: string | null;
};

/** Columns granted to anon/authenticated. Contact columns have no grant at all. */
export const REUSE_PUBLIC_COLUMNS =
  "id, user_id, listing_type, title, description, category, condition, price, location, area, image_url, status, created_at, updated_at";

export const REUSE_TAGLINE = "অপ্রয়োজনীয় জিনিস, অন্যের প্রয়োজন হতে পারে।";

export const REUSE_CATEGORIES = [
  "মোবাইল ও ইলেকট্রনিক্স",
  "কম্পিউটার ও ল্যাপটপ",
  "আসবাবপত্র",
  "ঘর ও রান্নাঘর",
  "পোশাক",
  "বই ও শিক্ষা",
  "টুলস ও যন্ত্রপাতি",
  "সাইকেল ও স্পোর্টস",
  "শিশুদের পণ্য",
  "গাড়ির আনুষঙ্গিক",
  "অন্যান্য",
] as const;

export const REUSE_CONDITIONS = ["নতুনের মতো", "ভালো", "ব্যবহৃত", "মেরামত প্রয়োজন"] as const;

export const REUSE_AREAS = [
  "রাজাপালং",
  "জালিয়াপালং",
  "হলদিয়াপালং",
  "রত্নাপালং",
  "পালংখালী",
  "অন্যান্য",
] as const;

export const REUSE_TYPE_META: Record<ReuseListingType, { label: string; className: string }> = {
  sale: { label: "🏷️ বিক্রয়", className: "border-primary/40 bg-primary/10 text-primary" },
  donation: {
    label: "🤝 দান",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

export const REUSE_STATUS_META: Record<ReuseStatus, { label: string; className: string }> = {
  pending: { label: "অপেক্ষমাণ", className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  approved: { label: "অনুমোদিত", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  rejected: { label: "প্রত্যাখ্যাত", className: "border-destructive/40 bg-destructive/10 text-destructive" },
  sold: { label: "বিক্রি হয়েছে", className: "border-border bg-muted text-muted-foreground" },
  donated: { label: "দান করা হয়েছে", className: "border-border bg-muted text-muted-foreground" },
  hidden: { label: "লুকানো", className: "border-border bg-muted text-muted-foreground" },
};

export const REUSE_REPORT_REASONS = [
  "ভুয়া বিজ্ঞাপন",
  "ভুল তথ্য",
  "আপত্তিকর বিষয়বস্তু",
  "নিষিদ্ধ পণ্য",
  "অন্যান্য",
] as const;

export const REUSE_PAGE_SIZE = 12;

/** Normalise a Bangladeshi/international mobile number to a dialable form. */
export function normalizeReusePhone(input: string): string {
  const raw = input.replace(/[^\d+]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return `+${raw.slice(2)}`;
  if (raw.startsWith("880")) return `+${raw}`;
  if (raw.startsWith("01") && raw.length === 11) return `+88${raw}`;
  return raw;
}
