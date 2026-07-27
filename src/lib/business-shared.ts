import { supabase } from "@/integrations/supabase/client";

export const BUSINESS_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type BusinessDay = (typeof BUSINESS_DAYS)[number];

export const DAY_LABEL_BN: Record<BusinessDay, string> = {
  mon: "সোমবার",
  tue: "মঙ্গলবার",
  wed: "বুধবার",
  thu: "বৃহস্পতিবার",
  fri: "শুক্রবার",
  sat: "শনিবার",
  sun: "রবিবার",
};

export type BusinessStatus = "pending" | "approved" | "rejected" | "suspended";

export type BusinessCategory = {
  id: string;
  name_bn: string;
  slug: string;
  group_bn: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

export type BusinessRow = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string | null;
  category_id: string | null;
  short_description: string | null;
  full_description: string | null;
  address: string | null;
  union_name: string | null;
  area: string | null;
  upazila: string;
  district: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  whatsapp: string | null;
  facebook_url: string | null;
  website_url: string | null;
  email: string | null;
  logo_url: string | null;
  cover_url: string | null;
  owner_photo_url: string | null;
  established_year: number | null;
  products: string[];
  status: BusinessStatus;
  is_verified: boolean;
  is_featured: boolean;
  is_sponsored: boolean;
  sponsor_until: string | null;
  view_count: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
};

export type BusinessHoursRow = {
  id: string;
  business_id: string;
  day: BusinessDay;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
};

export type BusinessGalleryRow = {
  id: string;
  business_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

export type BusinessReviewRow = {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string;
};

export const UPAZILAS = ["Ukhiya", "Cox's Bazar Sadar", "Ramu", "Teknaf", "Chakaria", "Pekua", "Kutubdia", "Moheshkhali"] as const;
export const UNIONS_UKHIYA = ["Palongkhali", "Jaliapalong", "Ratnapalong", "Haldiapalong", "Rajapalong"] as const;

export async function signBusinessMedia(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  const path = pathOrUrl.startsWith("business-media/") ? pathOrUrl.slice("business-media/".length) : pathOrUrl;
  const { data } = await supabase.storage.from("business-media").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export function isOpenNow(hours: BusinessHoursRow[] | undefined | null, now: Date = new Date()): boolean {
  if (!hours || hours.length === 0) return false;
  const dayIdx = now.getDay(); // 0=Sun..6=Sat
  const mapping: BusinessDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = mapping[dayIdx];
  const row = hours.find((h) => h.day === today);
  if (!row || row.is_closed || !row.open_time || !row.close_time) return false;
  const [oh, om] = row.open_time.split(":").map(Number);
  const [ch, cm] = row.close_time.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = oh * 60 + (om || 0);
  const close = ch * 60 + (cm || 0);
  if (close < open) {
    // overnight
    return cur >= open || cur <= close;
  }
  return cur >= open && cur <= close;
}
