/**
 * Mosque & Society module — shared types, Bangla labels and pure helpers.
 * Self-contained: only the mosque module depends on this file.
 */

export type MosqueStatus = "pending" | "verified" | "rejected";

export const MOSQUE_STATUS_LABEL_BN: Record<MosqueStatus, string> = {
  pending: "যাচাইাধীন",
  verified: "যাচাইকৃত",
  rejected: "প্রত্যাখ্যাত",
};

export type MosqueVisibility = "public" | "private";

export const VISIBILITY_LABEL_BN: Record<MosqueVisibility, string> = {
  public: "সবার জন্য",
  private: "গোপন",
};

export const COMMITTEE_POSITIONS = [
  "president",
  "vice_president",
  "secretary",
  "treasurer",
  "member",
] as const;
export type CommitteePosition = (typeof COMMITTEE_POSITIONS)[number];

export const COMMITTEE_POSITION_LABEL_BN: Record<CommitteePosition, string> = {
  president: "সভাপতি",
  vice_president: "সহ-সভাপতি",
  secretary: "সাধারণ সম্পাদক",
  treasurer: "কোষাধ্যক্ষ",
  member: "সদস্য",
};

export const PROJECT_STATUSES = ["planned", "ongoing", "completed", "paused"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL_BN: Record<ProjectStatus, string> = {
  planned: "পরিকল্পনাধীন",
  ongoing: "চলমান",
  completed: "সম্পন্ন",
  paused: "স্থগিত",
};

export const NOTICE_PRIORITIES = ["normal", "important", "urgent"] as const;
export type NoticePriority = (typeof NOTICE_PRIORITIES)[number];

export const NOTICE_PRIORITY_LABEL_BN: Record<NoticePriority, string> = {
  normal: "সাধারণ",
  important: "গুরুত্বপূর্ণ",
  urgent: "জরুরি",
};

export const DONATION_PURPOSES = [
  "মসজিদ নির্মাণ",
  "মসজিদ সম্প্রসারণ",
  "ওযুখানা",
  "সাউন্ড সিস্টেম",
  "বিদ্যুৎ",
  "ফ্যান/AC",
  "অন্যান্য উন্নয়ন",
] as const;

export const ANONYMOUS_DONOR_LABEL = "একজন শুভাকাঙ্ক্ষী";

/* ---------------------------------------------------------------- types */

export type MosqueRow = {
  id: string;
  slug: string | null;
  name: string;
  area: string | null;
  union_name: string | null;
  ward: string | null;
  upazila: string;
  district: string;
  established_year: number | null;
  imam_name: string | null;
  muazzin_name: string | null;
  phone: string | null;
  phone_visibility: MosqueVisibility;
  map_url: string | null;
  photo_url: string | null;
  description: string | null;
  finance_public: boolean;
  status: MosqueStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** Public list card shape — never carries a private phone. */
export type MosqueListItem = Pick<
  MosqueRow,
  "id" | "slug" | "name" | "area" | "union_name" | "upazila" | "district" | "photo_url" | "status" | "created_at"
>;

export type CommitteeMember = {
  id: string;
  mosque_id: string;
  full_name: string;
  photo_url: string | null;
  position: CommitteePosition;
  custom_title: string | null;
  phone: string | null;
  phone_visibility: MosqueVisibility;
  bio: string | null;
  sort_order: number;
};

export type SocietyLeader = {
  id: string;
  mosque_id: string;
  full_name: string;
  photo_url: string | null;
  role_title: string | null;
  phone: string | null;
  phone_visibility: MosqueVisibility;
  description: string | null;
  sort_order: number;
};

export type SocietyMember = {
  id: string;
  mosque_id: string;
  full_name: string;
  photo_url: string | null;
  family_name: string | null;
  phone: string | null;
  phone_visibility: MosqueVisibility;
  description: string | null;
  sort_order: number;
};

export type MosqueDonor = {
  id: string;
  mosque_id: string;
  full_name: string;
  photo_url: string | null;
  location: string | null;
  purpose: string | null;
  amount: number | null;
  donated_on: string | null;
  is_anonymous: boolean;
  amount_visibility: MosqueVisibility;
};

export type DevelopmentProject = {
  id: string;
  mosque_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  collected_amount: number;
  spent_amount: number;
  start_date: string | null;
  expected_completion_date: string | null;
  status: ProjectStatus;
  photos: string[];
  updates: string | null;
};

export type FinancialTransaction = {
  id: string;
  mosque_id: string;
  txn_type: "income" | "expense";
  txn_date: string;
  category: string;
  amount: number;
  description: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MosqueNotice = {
  id: string;
  mosque_id: string;
  title: string;
  description: string | null;
  notice_date: string;
  image_url: string | null;
  priority: NoticePriority;
};

export type MosqueActivity = {
  id: string;
  mosque_id: string;
  name: string;
  activity_date: string;
  location: string | null;
  description: string | null;
  organizer: string | null;
  photos: string[];
};

export type FinanceSummary = {
  visible: boolean;
  income: number;
  expense: number;
  balance: number;
};

export type MosqueDetail = {
  mosque: MosqueRow;
  committee: CommitteeMember[];
  leaders: SocietyLeader[];
  members: SocietyMember[];
  donors: MosqueDonor[];
  projects: DevelopmentProject[];
  notices: MosqueNotice[];
  activities: MosqueActivity[];
  finance: FinanceSummary;
  transactions: FinancialTransaction[];
  canManage: boolean;
};

/* -------------------------------------------------------------- helpers */

export function projectRemaining(p: Pick<DevelopmentProject, "target_amount" | "collected_amount">): number {
  return Math.max(0, Number(p.target_amount || 0) - Number(p.collected_amount || 0));
}

export function projectProgress(p: Pick<DevelopmentProject, "target_amount" | "collected_amount">): number {
  const target = Number(p.target_amount || 0);
  if (target <= 0) return 0;
  const pct = (Number(p.collected_amount || 0) / target) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

export function mosquePath(m: Pick<MosqueRow, "id" | "slug">): string {
  return m.slug || m.id;
}

export function mosqueLocationLine(
  m: Pick<MosqueRow, "area" | "union_name" | "ward" | "upazila" | "district">,
): string {
  return [m.area, m.union_name ? `${m.union_name} ইউনিয়ন` : null, m.ward ? `ওয়ার্ড ${m.ward}` : null, m.upazila, m.district]
    .filter(Boolean)
    .join(", ");
}

export function donorDisplayName(d: Pick<MosqueDonor, "full_name" | "is_anonymous">): string {
  return d.is_anonymous ? ANONYMOUS_DONOR_LABEL : d.full_name;
}
