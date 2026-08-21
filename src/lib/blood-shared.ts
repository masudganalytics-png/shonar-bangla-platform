export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const GENDERS = [
  { value: "male", label: "পুরুষ" },
  { value: "female", label: "নারী" },
  { value: "other", label: "অন্যান্য" },
] as const;

export const UKHIYA_UNIONS = [
  "জালিয়াপালং",
  "রত্নাপালং",
  "হলদিয়াপালং",
  "রাজাপালং",
  "পালংখালী",
] as const;

export type DonorRow = {
  id: string;
  full_name: string;
  blood_group: BloodGroup;
  /** Only readable by signed-in viewers; null for anonymous visitors. */
  phone?: string | null;
  whatsapp?: string | null;
  gender: "male" | "female" | "other" | null;
  age: number | null;
  union_name: string | null;
  village: string | null;
  address?: string | null;
  last_donation_date: string | null;
  available: boolean;
  photo_url: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
};

export type BloodRequestRow = {
  id: string;
  requester_id: string | null;
  patient_name: string;
  blood_group: BloodGroup;
  bags_needed: number;
  hospital_name: string;
  hospital_location: string | null;
  required_date: string;
  required_time: string | null;
  contact_person: string;
  phone: string;
  whatsapp: string | null;
  notes: string | null;
  status: "pending" | "approved" | "fulfilled" | "closed" | "rejected";
  created_at: string;
  updated_at: string;
};

export function formatBanglaDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function normalizePhone(p: string): string {
  return p.replace(/[^\d+]/g, "");
}
