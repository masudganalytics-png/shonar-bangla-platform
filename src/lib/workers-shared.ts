import { supabase } from "@/integrations/supabase/client";

export const DISTRICTS = ["Cox's Bazar"] as const;
export const UPAZILAS = ["Ukhiya", "Cox's Bazar Sadar", "Ramu", "Teknaf", "Chakaria", "Pekua", "Kutubdia", "Moheshkhali"] as const;

export type WorkerRow = {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  category_id: string | null;
  skills: string | null;
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

export async function signWorkerPhoto(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  const path = pathOrUrl.startsWith("worker-images/") ? pathOrUrl.slice("worker-images/".length) : pathOrUrl;
  const { data } = await supabase.storage.from("worker-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
