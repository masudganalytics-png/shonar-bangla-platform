import { supabase } from "@/integrations/supabase/client";

export const DISTRICTS = ["Cox's Bazar"] as const;
export const UPAZILAS = ["Ukhiya", "Cox's Bazar Sadar", "Ramu", "Teknaf", "Chakaria", "Pekua", "Kutubdia", "Moheshkhali"] as const;

export type TeacherRow = {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  category_id: string | null;
  subjects: string | null;
  qualification: string | null;
  experience_years: number | null;
  district: string;
  upazila: string;
  area: string | null;
  photo_url: string | null;
  description: string | null;
  is_available: boolean;
  is_verified: boolean;
  status: string;
  created_at: string;
};

export type CategoryRow = { id: string; name_bn: string; slug: string; sort_order: number; is_active: boolean };

export async function signTeacherPhoto(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl; // Cloudinary / external URL — use directly.
  const path = pathOrUrl.startsWith("teacher-images/") ? pathOrUrl.slice("teacher-images/".length) : pathOrUrl;
  const { data } = await supabase.storage.from("teacher-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
