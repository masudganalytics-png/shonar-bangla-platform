export const PROVIDERS = [
  { value: "PDB", label: "বাংলাদেশ বিদ্যুৎ উন্নয়ন বোর্ড (PDB)" },
  { value: "REB", label: "পল্লী বিদ্যুৎ (REB / পবিস)" },
  { value: "DPDC", label: "ঢাকা পাওয়ার ডিস্ট্রিবিউশন কোম্পানি (DPDC)" },
  { value: "DESCO", label: "ঢাকা ইলেকট্রিক সাপ্লাই কোম্পানি (DESCO)" },
  { value: "NESCO", label: "নর্দান ইলেকট্রিসিটি সাপ্লাই কোম্পানি (NESCO)" },
  { value: "WZPDCL", label: "ওয়েস্ট জোন পাওয়ার ডিস্ট্রিবিউশন (WZPDCL)" },
  { value: "OTHER", label: "অন্যান্য" },
] as const;

export const METER_TYPES = [
  { value: "postpaid", label: "পোস্টপেইড" },
  { value: "prepaid", label: "প্রিপেইড" },
  { value: "smart", label: "স্মার্ট মিটার" },
] as const;

export const UNIONS = [
  { value: "Rajapalong", label: "রাজাপালং" },
  { value: "Ratnapalong", label: "রত্নাপালং" },
  { value: "Haldiapalong", label: "হলদিয়াপালং" },
  { value: "Jaliapalong", label: "জালিয়াপালং" },
  { value: "Palongkhali", label: "পালংখালী" },
  { value: "Walapalong", label: "ওয়ালাপালং" },
] as const;

export const BN_MONTHS_FULL = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export function providerLabel(v: string | null | undefined) {
  return PROVIDERS.find((p) => p.value === v)?.label ?? v ?? "—";
}
export function meterTypeLabel(v: string | null | undefined) {
  return METER_TYPES.find((p) => p.value === v)?.label ?? v ?? "—";
}
export function unionLabel(v: string | null | undefined) {
  return UNIONS.find((p) => p.value === v)?.label ?? v ?? "—";
}
