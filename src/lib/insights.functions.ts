import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type BillPoint = {
  year: number;
  month: number;
  amount: number;
  units: number;
};

function linearForecast(points: number[]): number {
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0];
  const n = points.length;
  const xs = points.map((_, i) => i);
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = points.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (points[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return Math.max(0, slope * n + intercept);
}

function stats(values: number[]) {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

const InsightsInput = z.object({ months: z.number().int().min(3).max(24).default(12) });

export const getBillInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InsightsInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("bills")
      .select("bill_year, bill_month, amount, units_consumed, billing_month")
      .eq("user_id", userId)
      .order("bill_year", { ascending: true, nullsFirst: false })
      .order("bill_month", { ascending: true, nullsFirst: false });

    if (error) throw new Error(error.message);

    const points: BillPoint[] = (rows ?? [])
      .map((r) => {
        const y = r.bill_year ?? (r.billing_month ? new Date(r.billing_month).getFullYear() : null);
        const m = r.bill_month ?? (r.billing_month ? new Date(r.billing_month).getMonth() + 1 : null);
        if (!y || !m) return null;
        return { year: y, month: m, amount: Number(r.amount ?? 0), units: Number(r.units_consumed ?? 0) };
      })
      .filter((v): v is BillPoint => v !== null)
      .slice(-data.months);

    if (points.length === 0) {
      return {
        hasData: false as const,
        message: "পূর্বাভাস দিতে কমপক্ষে ১টি বিলের প্রয়োজন। আগে কিছু বিল যোগ করুন।",
      };
    }

    const amounts = points.map((p) => p.amount);
    const units = points.map((p) => p.units);
    const nextAmount = linearForecast(amounts);
    const nextUnits = linearForecast(units);
    const amountStats = stats(amounts);
    const unitStats = stats(units);

    // Abnormal detection: > 1.5 std dev away from mean
    const anomalies = points
      .map((p, i) => {
        const zA = amountStats.std > 0 ? (p.amount - amountStats.mean) / amountStats.std : 0;
        const zU = unitStats.std > 0 ? (p.units - unitStats.mean) / unitStats.std : 0;
        const severity = Math.max(Math.abs(zA), Math.abs(zU));
        return { index: i, point: p, zAmount: zA, zUnits: zU, severity };
      })
      .filter((a) => a.severity >= 1.5)
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3);

    // Compute next month/year
    const last = points[points.length - 1];
    const nextMonth = last.month === 12 ? 1 : last.month + 1;
    const nextYear = last.month === 12 ? last.year + 1 : last.year;

    // AI-generated insight (best-effort — if Lovable AI is unreachable, return heuristic summary)
    let aiSummary = "";
    const key = process.env.LOVABLE_API_KEY;
    if (key) {
      try {
        const compact = points.slice(-6).map((p) => `${p.year}-${String(p.month).padStart(2, "0")}: ${p.units}U ৳${p.amount}`).join(", ");
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "আপনি একজন সহায়ক বাংলা বিদ্যুৎ বিল বিশ্লেষক। সংক্ষিপ্ত (৩-৪ বাক্য), বাস্তবমুখী এবং সম্মানজনক পরামর্শ দিন। কোনো ভূমিকা বা শিরোনাম নয়।" },
              { role: "user", content: `আমার সাম্প্রতিক বিদ্যুৎ ব্যবহার: ${compact}. গড় বিল ৳${amountStats.mean.toFixed(0)}, গড় ইউনিট ${unitStats.mean.toFixed(0)}। পরবর্তী মাসের পূর্বাভাস ৳${nextAmount.toFixed(0)}। বাংলায় সংক্ষেপে বিশ্লেষণ ও সাশ্রয়ের পরামর্শ দিন।` },
            ],
          }),
        });
        if (resp.ok) {
          const j = await resp.json();
          aiSummary = j?.choices?.[0]?.message?.content?.trim() ?? "";
        }
      } catch {
        // ignore — fallback below
      }
    }
    if (!aiSummary) {
      const trend = nextAmount > amountStats.mean * 1.1 ? "বৃদ্ধি পাচ্ছে" : nextAmount < amountStats.mean * 0.9 ? "কমছে" : "স্থিতিশীল";
      aiSummary = `আপনার সাম্প্রতিক বিদ্যুৎ ব্যবহার ${trend}। গড় মাসিক বিল ৳${amountStats.mean.toFixed(0)}। অপ্রয়োজনীয় লাইট/ফ্যান বন্ধ রেখে এবং শক্তি-সাশ্রয়ী LED ব্যবহার করে খরচ কমানো যেতে পারে।`;
    }

    return {
      hasData: true as const,
      history: points,
      prediction: {
        year: nextYear,
        month: nextMonth,
        amount: Math.round(nextAmount),
        units: Math.round(nextUnits),
      },
      stats: {
        avgAmount: amountStats.mean,
        avgUnits: unitStats.mean,
        stdAmount: amountStats.std,
      },
      anomalies: anomalies.map((a) => ({
        year: a.point.year,
        month: a.point.month,
        amount: a.point.amount,
        units: a.point.units,
        reason: Math.abs(a.zAmount) > Math.abs(a.zUnits)
          ? (a.zAmount > 0 ? "স্বাভাবিকের চেয়ে অনেক বেশি বিল" : "স্বাভাবিকের চেয়ে অনেক কম বিল")
          : (a.zUnits > 0 ? "অস্বাভাবিক বেশি ইউনিট" : "অস্বাভাবিক কম ইউনিট"),
        severity: a.severity >= 2.5 ? "high" as const : "medium" as const,
      })),
      summary: aiSummary,
    };
  });
