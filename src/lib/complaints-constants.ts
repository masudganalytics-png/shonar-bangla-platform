export const COMPLAINT_REASONS = [
  { value: "high_bill", label: "অতিরিক্ত বিল (High Bill)" },
  { value: "wrong_reading", label: "ভুল রিডিং (Wrong Reading)" },
  { value: "wrong_tariff", label: "ভুল ট্যারিফ (Wrong Tariff)" },
  { value: "other", label: "অন্যান্য (Other)" },
] as const;

export const COMPLAINT_STATUS = [
  { value: "open", label: "খোলা", tone: "warning" },
  { value: "in_progress", label: "চলমান", tone: "primary" },
  { value: "resolved", label: "সমাধান হয়েছে", tone: "secondary" },
  { value: "rejected", label: "প্রত্যাখ্যাত", tone: "destructive" },
] as const;

export function reasonLabel(v: string | null | undefined) {
  return COMPLAINT_REASONS.find((r) => r.value === v)?.label ?? v ?? "—";
}
export function statusLabel(v: string | null | undefined) {
  return COMPLAINT_STATUS.find((s) => s.value === v)?.label ?? v ?? "—";
}
export function statusTone(v: string | null | undefined) {
  return COMPLAINT_STATUS.find((s) => s.value === v)?.tone ?? "muted";
}
