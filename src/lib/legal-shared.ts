import { supabase } from "@/integrations/supabase/client";

export const PRACTICE_AREAS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "land", label: "জমি সংক্রান্ত" },
  { value: "family", label: "পারিবারিক" },
  { value: "criminal", label: "ফৌজদারি" },
  { value: "civil", label: "দেওয়ানি" },
  { value: "business", label: "ব্যবসায়িক" },
  { value: "marriage", label: "বিবাহ ও তালাক" },
  { value: "inheritance", label: "উত্তরাধিকার" },
  { value: "labor", label: "শ্রম আইন" },
  { value: "cyber", label: "সাইবার" },
  { value: "other", label: "অন্যান্য" },
];

export const LANGUAGES: ReadonlyArray<string> = ["বাংলা", "ইংরেজি", "চাটগাঁইয়া", "উর্দু", "আরবি"];

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "নতুন",
  contacted: "যোগাযোগ হয়েছে",
  closed: "সমাপ্ত",
};

export type AdvocateRow = {
  id: string;
  full_name: string;
  photo_url: string | null;
  practice_areas: string[];
  chamber_address: string | null;
  experience_years: number | null;
  languages: string[];
  availability: string | null;
  phone: string | null;
  whatsapp: string;
  email: string | null;
  bio: string | null;
  is_verified: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type LegalLeadRow = {
  id: string;
  advocate_id: string | null;
  full_name: string;
  phone: string;
  category: string;
  description: string | null;
  status: "new" | "contacted" | "closed";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export function practiceAreaLabel(v: string) {
  return PRACTICE_AREAS.find((p) => p.value === v)?.label ?? v;
}

export async function signAdvocatePhoto(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("advocate-images/")
    ? pathOrUrl.slice("advocate-images/".length)
    : pathOrUrl;
  const { data } = await supabase.storage.from("advocate-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export function buildWhatsAppUrl(
  waNumber: string,
  { name, phone, categoryLabel, description }: { name: string; phone: string; categoryLabel: string; description?: string | null },
) {
  const digits = waNumber.replace(/\D/g, "");
  const msg =
    `Assalamu Alaikum.\n` +
    `My name is ${name}.\n` +
    `My phone number is ${phone}.\n` +
    `I need legal assistance regarding ${categoryLabel}.` +
    (description ? `\nIssue: ${description}` : "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}
