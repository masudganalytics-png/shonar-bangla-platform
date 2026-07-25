import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type MonthlyTrendPoint = {
  key: string; // YYYY-MM
  year: number;
  month: number; // 1-12
  avg_amount: number;
  avg_units: number;
  count: number;
};

export type UnionStat = {
  union_name: string;
  avg_amount: number;
  avg_units: number;
  count: number;
};

export type AnalyticsOverview = {
  total_bills: number;
  avg_bill: number;
  avg_unit: number;
  median_bill: number;
  highest_bill: number;
  lowest_bill: number;
  monthly_trend: MonthlyTrendPoint[];
  union_comparison: UnionStat[];
};

type BillRow = {
  amount: number | string | null;
  units_consumed: number | string | null;
  bill_year: number | null;
  bill_month: number | null;
  union_name: string | null;
};

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function computeOverview(rows: BillRow[]): AnalyticsOverview {
  const amounts = rows
    .map((r) => Number(r.amount))
    .filter((n) => Number.isFinite(n) && n > 0);
  const units = rows
    .map((r) => Number(r.units_consumed))
    .filter((n) => Number.isFinite(n) && n > 0);

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const avg = (a: number[]) => (a.length ? sum(a) / a.length : 0);

  // Monthly trend
  const byMonth = new Map<string, { amt: number[]; u: number[]; y: number; m: number }>();
  for (const r of rows) {
    if (!r.bill_year || !r.bill_month) continue;
    const key = `${r.bill_year}-${String(r.bill_month).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { amt: [], u: [], y: r.bill_year, m: r.bill_month };
    const a = Number(r.amount);
    const un = Number(r.units_consumed);
    if (Number.isFinite(a) && a > 0) bucket.amt.push(a);
    if (Number.isFinite(un) && un > 0) bucket.u.push(un);
    byMonth.set(key, bucket);
  }
  const monthly_trend: MonthlyTrendPoint[] = [...byMonth.entries()]
    .map(([key, v]) => ({
      key,
      year: v.y,
      month: v.m,
      avg_amount: avg(v.amt),
      avg_units: avg(v.u),
      count: Math.max(v.amt.length, v.u.length),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  // Union comparison
  const byUnion = new Map<string, { amt: number[]; u: number[] }>();
  for (const r of rows) {
    if (!r.union_name) continue;
    const bucket = byUnion.get(r.union_name) ?? { amt: [], u: [] };
    const a = Number(r.amount);
    const un = Number(r.units_consumed);
    if (Number.isFinite(a) && a > 0) bucket.amt.push(a);
    if (Number.isFinite(un) && un > 0) bucket.u.push(un);
    byUnion.set(r.union_name, bucket);
  }
  const union_comparison: UnionStat[] = [...byUnion.entries()]
    .map(([name, v]) => ({
      union_name: name,
      avg_amount: avg(v.amt),
      avg_units: avg(v.u),
      count: Math.max(v.amt.length, v.u.length),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total_bills: rows.length,
    avg_bill: avg(amounts),
    avg_unit: avg(units),
    median_bill: median(amounts),
    highest_bill: amounts.length ? Math.max(...amounts) : 0,
    lowest_bill: amounts.length ? Math.min(...amounts) : 0,
    monthly_trend,
    union_comparison,
  };
}

export const getAnalyticsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<AnalyticsOverview> => {
    // Use admin to compute aggregates across all users. Only aggregates are
    // returned — never individual bills or user identifiers.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("bills")
      .select("amount, units_consumed, bill_year, bill_month, union_name")
      .limit(50000);
    if (error) throw new Error(error.message);
    return computeOverview((data ?? []) as BillRow[]);
  });

const CompareInput = z.object({
  amount: z.number().nonnegative(),
  units: z.number().nonnegative(),
  union_name: z.string().min(1).nullable().optional(),
  bill_year: z.number().int().min(2000).max(2100).nullable().optional(),
  bill_month: z.number().int().min(1).max(12).nullable().optional(),
});

export type CompareVerdict = "normal" | "higher" | "unusual";

export type CompareResult = {
  verdict: CompareVerdict;
  amount_diff_pct: number; // vs benchmark avg amount
  units_diff_pct: number; // vs benchmark avg units
  benchmark_avg_amount: number;
  benchmark_avg_units: number;
  benchmark_sample: number;
  benchmark_scope: "union_month" | "union" | "month" | "all";
};

export const compareMyBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CompareInput.parse(d))
  .handler(async ({ data }): Promise<CompareResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    async function fetchRows(filters: {
      union?: string | null;
      year?: number | null;
      month?: number | null;
    }): Promise<BillRow[]> {
      let q = supabaseAdmin
        .from("bills")
        .select("amount, units_consumed, bill_year, bill_month, union_name")
        .limit(50000);
      if (filters.union) q = q.eq("union_name", filters.union);
      if (filters.year) q = q.eq("bill_year", filters.year);
      if (filters.month) q = q.eq("bill_month", filters.month);
      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      return (rows ?? []) as BillRow[];
    }

    // Try tightest scope first, fall back until we get a meaningful sample.
    const MIN_SAMPLE = 3;
    const attempts: Array<{ scope: CompareResult["benchmark_scope"]; f: Parameters<typeof fetchRows>[0] }> = [
      { scope: "union_month", f: { union: data.union_name ?? null, year: data.bill_year ?? null, month: data.bill_month ?? null } },
      { scope: "union", f: { union: data.union_name ?? null } },
      { scope: "month", f: { year: data.bill_year ?? null, month: data.bill_month ?? null } },
      { scope: "all", f: {} },
    ];

    let rows: BillRow[] = [];
    let scope: CompareResult["benchmark_scope"] = "all";
    for (const a of attempts) {
      // Skip scope if required filter is missing
      if (a.scope === "union_month" && (!a.f.union || !a.f.year || !a.f.month)) continue;
      if (a.scope === "union" && !a.f.union) continue;
      if (a.scope === "month" && (!a.f.year || !a.f.month)) continue;
      const r = await fetchRows(a.f);
      if (r.length >= MIN_SAMPLE) {
        rows = r;
        scope = a.scope;
        break;
      }
      if (a.scope === "all") {
        rows = r;
        scope = a.scope;
      }
    }

    const amounts = rows.map((r) => Number(r.amount)).filter((n) => Number.isFinite(n) && n > 0);
    const units = rows.map((r) => Number(r.units_consumed)).filter((n) => Number.isFinite(n) && n > 0);
    const avgA = amounts.length ? amounts.reduce((x, y) => x + y, 0) / amounts.length : 0;
    const avgU = units.length ? units.reduce((x, y) => x + y, 0) / units.length : 0;

    const amtPct = avgA > 0 ? ((data.amount - avgA) / avgA) * 100 : 0;
    const unitPct = avgU > 0 ? ((data.units - avgU) / avgU) * 100 : 0;

    // Verdict on amount primarily; unit deviation reinforces "unusual"
    let verdict: CompareVerdict = "normal";
    const maxDev = Math.max(Math.abs(amtPct), Math.abs(unitPct));
    if (maxDev >= 50) verdict = "unusual";
    else if (amtPct >= 15 || unitPct >= 15) verdict = "higher";

    return {
      verdict,
      amount_diff_pct: amtPct,
      units_diff_pct: unitPct,
      benchmark_avg_amount: avgA,
      benchmark_avg_units: avgU,
      benchmark_sample: rows.length,
      benchmark_scope: scope,
    };
  });
