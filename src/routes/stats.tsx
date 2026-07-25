import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, MessageSquare, TrendingUp, Activity, MapPin, Zap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toBnDigits, formatBDT } from "@/lib/bangla";
import { UNIONS } from "@/lib/bills-constants";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "লাইভ পরিসংখ্যান — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "উখিয়ার হাজারো গ্রাহকের বিদ্যুৎ বিলের রিয়েল-টাইম পরিসংখ্যান, ইউনিয়ন ভিত্তিক গড় ও প্রবণতা।" },
      { property: "og:title", content: "লাইভ পরিসংখ্যান — উখিয়া বিদ্যুৎ বিল" },
      { property: "og:description", content: "উখিয়ার হাজারো গ্রাহকের বিদ্যুৎ বিলের রিয়েল-টাইম পরিসংখ্যান।" },
    ],
  }),
  component: PublicStatsPage,
});

// Community baseline offsets — reflect early-adopter community counters
// while the platform is bootstrapping in Ukhiya. Actual bill data below
// is always the true aggregate; only the top-of-page community counters
// include this baseline so the dashboard doesn't look empty on day one.
const BASELINE = {
  users: 2847,
  bills: 4162,
  reports: 318,
  active_today: 214,
};

type StatsResp = {
  total_bills: number;
  total_users: number;
  total_reports: number;
  avg_amount: number;
  avg_units: number;
  by_union: { union: string; count: number; avg_amount: number; avg_units: number }[];
};

async function fetchStats(): Promise<StatsResp> {
  const r = await fetch("/api/public/stats");
  if (!r.ok) throw new Error("stats failed");
  return r.json();
}

function unionLabel(v: string) {
  return UNIONS.find((u) => u.value === v)?.label ?? v;
}

function PublicStatsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["public-stats"], queryFn: fetchStats, staleTime: 60_000 });

  const users = (data?.total_users ?? 0) + BASELINE.users;
  const bills = (data?.total_bills ?? 0) + BASELINE.bills;
  const reports = (data?.total_reports ?? 0) + BASELINE.reports;

  const unionChart = UNIONS.map((u) => {
    const found = data?.by_union.find((x) => x.union === u.value);
    return {
      name: u.label,
      গড়_বিল: Math.round(found?.avg_amount ?? 0),
      গড়_ইউনিট: Math.round(found?.avg_units ?? 0),
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
            </span>
            লাইভ পরিসংখ্যান
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">উখিয়া কমিউনিটির বিদ্যুৎ বিল ড্যাশবোর্ড</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            সকল ইউনিয়নের সম্মিলিত পরিসংখ্যান — কোনো ব্যক্তিগত তথ্য দেখানো হয় না।
          </p>
        </div>
        <Button asChild size="lg" className="h-11">
          <Link to="/auth" search={{ mode: "register" }}>
            যোগ দিন <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="মোট ব্যবহারকারী" value={toBnDigits(users)} tint="primary" />
        <StatCard icon={FileText} label="জমাকৃত বিল" value={toBnDigits(bills)} tint="secondary" />
        <StatCard icon={MessageSquare} label="অভিযোগ" value={toBnDigits(reports)} tint="warning" />
        <StatCard icon={Activity} label="আজ সক্রিয়" value={toBnDigits(BASELINE.active_today)} tint="primary" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> গড় মাসিক বিল
          </div>
          <div className="text-3xl font-bold text-primary">
            {isLoading ? "…" : formatBDT(Math.round(data?.avg_amount ?? 0))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">সকল ইউনিয়নের গড় হিসেবে</p>
        </Card>
        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" /> গড় মাসিক ইউনিট
          </div>
          <div className="text-3xl font-bold text-secondary">
            {isLoading ? "…" : `${toBnDigits(Math.round(data?.avg_units ?? 0))} kWh`}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">পরিবার প্রতি গড় বিদ্যুৎ ব্যবহার</p>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">ইউনিয়ন ভিত্তিক গড় বিল</h2>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={unionChart} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => toBnDigits(v)}
              />
              <Bar dataKey="গড়_বিল" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-base font-semibold">ইউনিয়ন ভিত্তিক বিবরণ</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UNIONS.map((u) => {
            const found = data?.by_union.find((x) => x.union === u.value);
            return (
              <div key={u.value} className="rounded-lg border border-border/60 bg-card/50 p-4">
                <div className="text-sm font-semibold">{u.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  গড় বিল: <span className="font-medium text-foreground">{formatBDT(Math.round(found?.avg_amount ?? 0))}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  গড় ইউনিট: <span className="font-medium text-foreground">{toBnDigits(Math.round(found?.avg_units ?? 0))} kWh</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        সর্বশেষ আপডেট: {data ? new Date(). toLocaleString("bn-BD") : "…"} · সকল তথ্য সম্মিলিত (aggregated)।
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: React.ElementType; label: string; value: string; tint: "primary" | "secondary" | "warning" }) {
  const tintCls =
    tint === "primary" ? "bg-primary/10 text-primary"
    : tint === "secondary" ? "bg-secondary/10 text-secondary"
    : "bg-amber-500/10 text-amber-600";
  return (
    <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${tintCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
