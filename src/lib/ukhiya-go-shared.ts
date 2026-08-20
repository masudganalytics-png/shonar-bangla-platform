/**
 * UkhiyaGo — shared types & constants (Phase 2: driver + vehicle registration).
 * Self-contained: only ukhiya-go modules import this file.
 */

export type UkhiyaGoVerificationStatus = "pending" | "approved" | "rejected" | "suspended";

export type UkhiyaGoVehicleType =
  | "car"
  | "microbus"
  | "noah"
  | "hiace"
  | "cng"
  | "tomtom"
  | "bike"
  | "rickshaw"
  | "pickup"
  | "truck"
  | "ambulance"
  | "other";

export const UKHIYA_GO_VEHICLE_TYPES: { value: UkhiyaGoVehicleType; label: string }[] = [
  { value: "car", label: "কার" },
  { value: "microbus", label: "মাইক্রোবাস" },
  { value: "noah", label: "নোহা" },
  { value: "hiace", label: "হাইএস" },
  { value: "cng", label: "সিএনজি" },
  { value: "tomtom", label: "টমটম" },
  { value: "bike", label: "মোটরসাইকেল" },
  { value: "rickshaw", label: "রিকশা" },
  { value: "pickup", label: "পিকআপ" },
  { value: "other", label: "অন্যান্য" },
];

export const UKHIYA_GO_SERVICES = [
  { value: "local_ride", label: "লোকাল রাইড" },
  { value: "long_distance", label: "দূরপাল্লার রাইড" },
  { value: "return_trip", label: "ফেরত ট্রিপ" },
  { value: "airport", label: "এয়ারপোর্ট ট্রিপ" },
  { value: "emergency", label: "জরুরি রাইড" },
  { value: "parcel", label: "পার্সেল ডেলিভারি" },
  { value: "cargo", label: "মালামাল পরিবহন" },
  { value: "business", label: "ব্যবসায়িক পরিবহন" },
] as const;

export const UKHIYA_GO_SERVICE_AREAS = [
  "উখিয়া সদর",
  "কোটবাজার",
  "মরিচ্যা",
  "কুতুপালং",
  "পালংখালী",
  "রত্নাপালং",
  "হলদিয়াপালং",
  "রাজাপালং",
  "জালিয়াপালং",
  "টেকনাফ",
  "কক্সবাজার",
  "চট্টগ্রাম",
] as const;

export const UKHIYA_GO_STATUS_META: Record<
  UkhiyaGoVerificationStatus,
  { label: string; description: string }
> = {
  pending: {
    label: "অপেক্ষমাণ",
    description: "আপনার তথ্য যাচাইয়ের জন্য জমা হয়েছে। অনুমোদনের পর প্রোফাইল প্রকাশিত হবে।",
  },
  approved: { label: "অনুমোদিত", description: "আপনার প্রোফাইল যাচাই করা হয়েছে।" },
  rejected: { label: "প্রত্যাখ্যাত", description: "তথ্য যাচাই করা যায়নি। সংশোধন করে আবার জমা দিন।" },
  suspended: { label: "স্থগিত", description: "আপনার প্রোফাইলটি সাময়িকভাবে স্থগিত আছে।" },
};

/** Bangladeshi phone normalization to 01XXXXXXXXX form. */
export function normalizeUkhiyaGoPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  if (digits.length === 10) return `0${digits}`;
  return digits;
}

export function isValidBdPhone(value: string): boolean {
  return /^01[3-9]\d{8}$/.test(normalizeUkhiyaGoPhone(value));
}
