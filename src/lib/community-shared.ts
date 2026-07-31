/**
 * Community module — shared types, labels and helpers.
 * Self-contained: only the community module depends on this file.
 */

export const COMMUNITY_KINDS = ["community", "club", "group"] as const;
export type CommunityKind = (typeof COMMUNITY_KINDS)[number];

export const KIND_LABEL_BN: Record<CommunityKind, string> = {
  community: "কমিউনিটি",
  club: "সোশ্যাল ক্লাব",
  group: "গ্রুপ",
};

export const GROUP_TYPES = [
  "school_batch",
  "college_batch",
  "university_batch",
  "friends",
  "sports_team",
  "neighborhood",
  "other",
] as const;
export type CommunityGroupType = (typeof GROUP_TYPES)[number];

export const GROUP_TYPE_LABEL_BN: Record<CommunityGroupType, string> = {
  school_batch: "স্কুল ব্যাচ",
  college_batch: "কলেজ ব্যাচ",
  university_batch: "বিশ্ববিদ্যালয় ব্যাচ",
  friends: "বন্ধুদের গ্রুপ",
  sports_team: "স্পোর্টস টিম",
  neighborhood: "এলাকাভিত্তিক গ্রুপ",
  other: "অন্যান্য",
};

export const EVENT_CATEGORIES = [
  "walima",
  "akika",
  "milad",
  "iftar",
  "khela",
  "mela",
  "social",
  "other",
] as const;
export type CommunityEventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_LABEL_BN: Record<CommunityEventCategory, string> = {
  walima: "ওয়ালিমা",
  akika: "আকিকা",
  milad: "মিলাদ",
  iftar: "ইফতার",
  khela: "খেলা",
  mela: "মেলা",
  social: "সামাজিক অনুষ্ঠান",
  other: "অন্যান্য",
};

export const EVENT_CATEGORY_ICON: Record<CommunityEventCategory, string> = {
  walima: "🍛",
  akika: "🐐",
  milad: "🕌",
  iftar: "🌙",
  khela: "⚽",
  mela: "🎪",
  social: "🎉",
  other: "📌",
};

export type CommunityMemberRole = "owner" | "admin" | "member";

export const MEMBER_ROLE_LABEL_BN: Record<CommunityMemberRole, string> = {
  owner: "মালিক",
  admin: "অ্যাডমিন",
  member: "সদস্য",
};

export type CommunityVisibility = "public" | "members";

export const VISIBILITY_LABEL_BN: Record<CommunityVisibility, string> = {
  public: "সবার জন্য",
  members: "শুধু সদস্যদের জন্য",
};

export type CommunityRow = {
  id: string;
  kind: CommunityKind;
  group_type: CommunityGroupType | null;
  name: string;
  slug: string | null;
  description: string | null;
  area: string | null;
  logo_url: string | null;
  cover_url: string | null;
  created_by: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CommunityMemberRow = {
  id: string;
  community_id: string;
  user_id: string;
  role: CommunityMemberRole;
  created_at: string;
};

export type CommunityPostRow = {
  id: string;
  community_id: string | null;
  author_id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  report_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type CommunityEventRow = {
  id: string;
  community_id: string | null;
  organizer_id: string;
  title: string;
  category: CommunityEventCategory;
  area: string | null;
  description: string | null;
  event_date: string;
  event_time: string | null;
  cover_url: string | null;
  visibility: CommunityVisibility;
  like_count: number;
  report_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

/** Minimal, publicly safe author info. Never contains a phone number. */
export type CommunityPublicProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  area: string | null;
};

export type FeedItem =
  | { type: "post"; id: string; created_at: string; post: CommunityPostRow }
  | { type: "event"; id: string; created_at: string; event: CommunityEventRow };

export const COMMUNITY_AREAS = [
  "রাজাপালং",
  "হলদিয়াপালং",
  "রত্নাপালং",
  "জালিয়াপালং",
  "পালংখালী",
  "উখিয়া সদর",
  "কোর্টবাজার",
  "অন্যান্য",
] as const;

/** Human readable relative time in Bangla. */
export function timeAgoBn(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "এইমাত্র";
  if (min < 60) return String(min) + " মিনিট আগে";
  const hr = Math.floor(min / 60);
  if (hr < 24) return String(hr) + " ঘণ্টা আগে";
  const day = Math.floor(hr / 24);
  if (day < 30) return String(day) + " দিন আগে";
  const mo = Math.floor(day / 30);
  if (mo < 12) return String(mo) + " মাস আগে";
  return String(Math.floor(mo / 12)) + " বছর আগে";
}

export function communityPath(c: Pick<CommunityRow, "id" | "slug">): string {
  return c.slug || c.id;
}

/** Build a share URL for any community entity. */
export function shareUrl(path: string): string {
  if (typeof window === "undefined") return "https://khijirion.com" + path;
  return window.location.origin + path;
}

export async function shareLink(title: string, path: string): Promise<"shared" | "copied"> {
  const url = shareUrl(path);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch {
      /* user cancelled — fall through to copy */
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
