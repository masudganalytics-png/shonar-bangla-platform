import type { LucideIcon } from "lucide-react";
import {
  UtensilsCrossed, Bus, ShoppingBag, ReceiptText,
  HeartPulse, GraduationCap, Clapperboard, Package,
} from "lucide-react";

export type ExpenseCategory =
  | "food" | "transport" | "shopping" | "bills"
  | "health" | "education" | "entertainment" | "other";

export interface CategoryMeta {
  value: ExpenseCategory;
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for a soft chip */
  chip: string;
  /** Text color for accents */
  text: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { value: "food",          label: "খাবার",       icon: UtensilsCrossed, chip: "bg-orange-100 text-orange-800", text: "text-orange-700" },
  { value: "transport",     label: "যাতায়াত",     icon: Bus,             chip: "bg-blue-100 text-blue-800",     text: "text-blue-700" },
  { value: "shopping",      label: "কেনাকাটা",    icon: ShoppingBag,     chip: "bg-pink-100 text-pink-800",     text: "text-pink-700" },
  { value: "bills",         label: "বিল",         icon: ReceiptText,     chip: "bg-amber-100 text-amber-800",   text: "text-amber-700" },
  { value: "health",        label: "স্বাস্থ্য",    icon: HeartPulse,      chip: "bg-rose-100 text-rose-800",     text: "text-rose-700" },
  { value: "education",     label: "শিক্ষা",       icon: GraduationCap,   chip: "bg-indigo-100 text-indigo-800", text: "text-indigo-700" },
  { value: "entertainment", label: "বিনোদন",      icon: Clapperboard,    chip: "bg-violet-100 text-violet-800", text: "text-violet-700" },
  { value: "other",         label: "অন্যান্য",     icon: Package,         chip: "bg-slate-100 text-slate-800",   text: "text-slate-700" },
];

export const CATEGORY_MAP: Record<ExpenseCategory, CategoryMeta> =
  Object.fromEntries(CATEGORIES.map((c) => [c.value, c])) as Record<ExpenseCategory, CategoryMeta>;
