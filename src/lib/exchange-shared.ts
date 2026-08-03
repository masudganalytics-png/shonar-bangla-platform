export type RateStatus = "increased" | "decreased" | "stable";

export type ExchangeRateRow = {
  id: string;
  country_name: string;
  country_name_bn: string;
  flag_emoji: string;
  currency_name: string;
  currency_code: string;
  exchange_rate_to_bdt: number;
  previous_rate: number;
  rate_status: RateStatus;
  sort_order: number;
  last_updated: string;
};

export const RATE_STATUS_META: Record<RateStatus, { label: string; dot: string; className: string }> = {
  increased: { label: "বেড়েছে", dot: "🟢", className: "text-emerald-600 dark:text-emerald-400" },
  decreased: { label: "কমেছে", dot: "🔴", className: "text-destructive" },
  stable: { label: "অপরিবর্তিত", dot: "⚪", className: "text-muted-foreground" },
};

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBanglaDigits(value: string): string {
  return value.replace(/\d/g, (d) => BN_DIGITS[Number(d)]!);
}

export function formatRate(value: number): string {
  return toBanglaDigits(
    value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  );
}

export function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return toBanglaDigits(`${date} • ${time}`);
}
