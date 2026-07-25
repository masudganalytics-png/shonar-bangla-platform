import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=300, s-maxage=900",
};

export const Route = createFileRoute("/api/public/stats")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [billsRes, profilesRes, reportsRes] = await Promise.all([
          supabaseAdmin.from("bills").select("amount, units_consumed, union_name, bill_month, bill_year"),
          supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("reports").select("id", { count: "exact", head: true }),
        ]);
        if (billsRes.error) return new Response(JSON.stringify({ error: billsRes.error.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
        const rows = billsRes.data ?? [];
        const total = rows.length;
        const avgAmount = total ? rows.reduce((s, r) => s + Number(r.amount ?? 0), 0) / total : 0;
        const avgUnits = total ? rows.reduce((s, r) => s + Number(r.units_consumed ?? 0), 0) / total : 0;
        const byUnion: Record<string, { count: number; amount: number; units: number }> = {};
        for (const r of rows) {
          const k = r.union_name ?? "unknown";
          byUnion[k] ??= { count: 0, amount: 0, units: 0 };
          byUnion[k].count++;
          byUnion[k].amount += Number(r.amount ?? 0);
          byUnion[k].units += Number(r.units_consumed ?? 0);
        }
        const unions = Object.entries(byUnion).map(([union, v]) => ({
          union,
          count: v.count,
          avg_amount: v.count ? v.amount / v.count : 0,
          avg_units: v.count ? v.units / v.count : 0,
        }));
        return new Response(JSON.stringify({
          generated_at: new Date().toISOString(),
          total_bills: total,
          total_users: profilesRes.count ?? 0,
          total_reports: reportsRes.count ?? 0,
          avg_amount: avgAmount,
          avg_units: avgUnits,
          by_union: unions,
        }), { headers: { ...CORS, "Content-Type": "application/json" } });
      },
    },
  },
});
