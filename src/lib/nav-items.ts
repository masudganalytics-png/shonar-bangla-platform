/** Shared header navigation items. `to` doubles as the nav_settings key. */
export type NavItem = { to: string; label: string; auth?: boolean };

export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "হোম" },
  { to: "/stats", label: "পরিসংখ্যান" },
  { to: "/bills/new", label: "বিল জমা", auth: true },
  { to: "/compare", label: "তুলনা", auth: true },
  { to: "/calculator", label: "ক্যালকুলেটর" },
  { to: "/isp", label: "ওয়াইফাই সেবা" },
  { to: "/helpline", label: "হেল্পলাইন" },
  { to: "/teachers", label: "শিক্ষক খুঁজুন" },
  { to: "/workers", label: "কাজের লোক" },
  { to: "/community", label: "কমিউনিটি" },
  { to: "/probashi", label: "প্রবাসী কর্নার" },
  { to: "/govt-jobs", label: "সরকারি চাকরিজীবী" },
  { to: "/services/ukhiya-go", label: "🚗 UkhiyaGo" },
];
