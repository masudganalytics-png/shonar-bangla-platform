import { supabase } from "@/integrations/supabase/client";

export async function signEducationMedia(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("education-media/") ? pathOrUrl.slice("education-media/".length) : pathOrUrl;
  const { data } = await supabase.storage.from("education-media").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export const TUTOR_GENDERS = [
  { value: "male", label: "পুরুষ" },
  { value: "female", label: "মহিলা" },
  { value: "any", label: "যেকোনো" },
] as const;

export const TUITION_MODES = [
  { value: "offline", label: "সরাসরি" },
  { value: "online", label: "অনলাইন" },
  { value: "both", label: "উভয়" },
] as const;

export const STUDENT_CLASSES = [
  "১ম শ্রেণি", "২য় শ্রেণি", "৩য় শ্রেণি", "৪র্থ শ্রেণি", "৫ম শ্রেণি",
  "৬ষ্ঠ শ্রেণি", "৭ম শ্রেণি", "৮ম শ্রেণি", "৯ম শ্রেণি", "১০ম শ্রেণি",
  "একাদশ", "দ্বাদশ", "অনার্স", "মাস্টার্স", "ভর্তি প্রস্তুতি", "চাকরি প্রস্তুতি",
] as const;

export const RESOURCE_TYPES = [
  { value: "website", label: "ওয়েবসাইট" },
  { value: "gdrive", label: "Google Drive" },
  { value: "youtube", label: "YouTube" },
  { value: "pdf", label: "PDF" },
  { value: "link", label: "লিংক" },
] as const;

export const TUITION_STATUS_LABEL: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",
  matched: "মিলেছে",
  filled: "পূর্ণ",
  closed: "বন্ধ",
};

export const TUITION_APP_STATUS_LABEL: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  accepted: "গৃহীত",
  rejected: "প্রত্যাখ্যাত",
  withdrawn: "প্রত্যাহৃত",
};

export type TuitionRequestPublic = {
  id: string;
  district: string;
  upazila: string;
  area: string | null;
  student_class: string;
  subject: string;
  preferred_gender: "male" | "female" | "any";
  budget: number | null;
  days_per_week: number | null;
  preferred_time: string | null;
  mode: "online" | "offline" | "both";
  notes: string | null;
  status: string;
  created_at: string;
};

export type TuitionRequestAdmin = TuitionRequestPublic & {
  parent_name: string;
  phone: string;
  submitted_by: string | null;
  matched_tutor_id: string | null;
  updated_at: string;
};

export type EducationNewsRow = {
  id: string;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  category: string | null;
  content: string;
  excerpt: string | null;
  publish_date: string;
  is_published: boolean;
  created_at: string;
};

export type AchievementRow = {
  id: string;
  student_name: string;
  photo_url: string | null;
  institution: string | null;
  area: string | null;
  achievement: string;
  story: string | null;
  is_published: boolean;
  created_at: string;
};

export type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  student_class: string | null;
  subject: string | null;
  category: string | null;
  thumbnail_url: string | null;
  resource_type: "website" | "gdrive" | "youtube" | "pdf" | "link";
  external_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

export type TuitionApplicationRow = {
  id: string;
  request_id: string;
  tutor_id: string;
  applied_by: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
};
