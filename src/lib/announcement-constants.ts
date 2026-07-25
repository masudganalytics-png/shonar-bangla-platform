export const ANNOUNCEMENT_CATEGORIES = [
  { value: "notice", label: "সরকারি নোটিশ", tone: "bg-primary/10 text-primary border-primary/20" },
  { value: "outage", label: "বিদ্যুৎ বিভ্রাট", tone: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  { value: "tariff", label: "ট্যারিফ পরিবর্তন", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  { value: "general", label: "সাধারণ", tone: "bg-muted text-foreground border-border" },
] as const;

export type AnnouncementCategory = typeof ANNOUNCEMENT_CATEGORIES[number]["value"];

export const ANNOUNCEMENT_PRIORITIES = [
  { value: "low", label: "নিম্ন" },
  { value: "normal", label: "স্বাভাবিক" },
  { value: "high", label: "উচ্চ" },
  { value: "urgent", label: "জরুরি" },
] as const;

export function categoryMeta(v: string | null | undefined) {
  return ANNOUNCEMENT_CATEGORIES.find((c) => c.value === v) ?? ANNOUNCEMENT_CATEGORIES[3];
}

export function priorityLabel(v: string | null | undefined) {
  return ANNOUNCEMENT_PRIORITIES.find((c) => c.value === v)?.label ?? v ?? "—";
}
