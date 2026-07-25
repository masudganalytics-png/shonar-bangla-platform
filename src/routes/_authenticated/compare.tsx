import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { CircleCheck, TriangleAlert, OctagonAlert, TrendingUp, Wallet, Zap, BarChart3, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalyticsOverview, compareMyBill } from "@/lib/analytics.functions";
import type { CompareResult } from "@/lib/analytics.functions";
import { formatBanglaCurrency, toBanglaDigits } from "@/lib/bangla";
import { UNIONS, BN_MONTHS_FULL, YEAR_OPTIONS, unionLabel } from "@/lib/bills-constants";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({
    meta: [
      { title: "তুলনা ও বিশ্লেষণ — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "গড়, মিডিয়ান, সর্বোচ্চ-সর্বনিম্ন বিল, মাসিক ট্রেন্ড এবং ইউনিয়ন-ভিত্তিক তুলনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const overview = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => getAnalyticsOverview(),
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">বিশ্লেষণ</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">তুলনা ও পরিসংখ্যান ড্যাশবোর্ড</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          সম্পূর্ণ পরিসংখ্যান সমষ্টিগত (aggregate) — অন্য কোনো গ্রাহকের বিলের বিস্তারিত তথ্য কখনও প্রকাশ করা হয় না।
        </p>
      </header>

      <CompareCard />

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">সারসংক্ষেপ</h2>
        {overview.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : overview.isError ? (
          <Card className="p-4 text-sm text-destructive">তথ্য লোড করা যায়নি।</Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat icon={Wallet} label="গড় বিল" value={formatBanglaCurrency(overview.data!.avg_bill)} />
            <Stat icon={Zap} label="গড় ইউনিট" value={`${toBanglaDigits(overview.data!.avg_unit.toFixed(1))} kWh`} />
            <Stat icon={BarChart3} label="মিডিয়ান বিল" value={formatBanglaCurrency(overview.data!.median_bill)} />
            <Stat icon={TrendingUp} label="সর্বোচ্চ বিল" value={formatBanglaCurrency(overview.data!.highest_bill)} />
            <Stat icon={TrendingUp} label="সর্বনিম্ন বিল" value={formatBanglaCurrency(overview.data!.lowest_bill)} />
          </div>
        )}
        {overview.data && (
          <p className="mt-2 text-xs text-muted-foreground">
            মোট নমুনা: {toBanglaDigits(overview.data.total_bills)}টি বিল
          </p>
        )}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <ChartCard title="মাসিক ট্রেন্ড — গড় বিল">
          {overview.data ? (
            <MonthlyAmountChart data={overview.data.monthly_trend} />
          ) : (
            <Skeleton className="h-72 w-full" />
          )}
        </ChartCard>
        <ChartCard title="মাসিক ট্রেন্ড — গড় ইউনিট">
          {overview.data ? (
            <MonthlyUnitsChart data={overview.data.monthly_trend} />
          ) : (
            <Skeleton className="h-72 w-full" />
          )}
        </ChartCard>
        <ChartCard title="ইউনিয়ন তুলনা — গড় বিল">
          {overview.data ? (
            <UnionAmountChart data={overview.data.union_comparison} />
          ) : (
            <Skeleton className="h-72 w-full" />
          )}
        </ChartCard>
        <ChartCard title="ইউনিয়ন তুলনা — গড় ইউনিট">
          {overview.data ? (
            <UnionUnitsChart data={overview.data.union_comparison} />
          ) : (
            <Skeleton className="h-72 w-full" />
          )}
        </ChartCard>
      </section>
    </div>
  );
}

/* --------------------------------- Compare -------------------------------- */

function CompareCard() {
  const compareFn = useServerFn(compareMyBill);
  const now = new Date();
  const [amount, setAmount] = useState("");
  const [units, setUnits] = useState("");
  const [unionName, setUnionName] = useState<string>(UNIONS[0].value);
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));
  const [year, setYear] = useState<string>(String(now.getFullYear()));

  const mut = useMutation({
    mutationFn: (v: { amount: number; units: number; union_name: string; bill_year: number; bill_month: number }) =>
      compareFn({ data: v }),
  });

  const canSubmit = Number(amount) > 0 && Number(units) > 0 && unionName;

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">আমার বিল তুলনা করুন</h2>
        <p className="text-sm text-muted-foreground">
          আপনার বিল, ইউনিট এবং ইউনিয়ন লিখুন — এলাকার গড়ের সাথে তুলনা করা হবে।
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="cmp-amount">বিল (৳)</Label>
          <Input id="cmp-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="যেমন: 850" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cmp-units">ইউনিট (kWh)</Label>
          <Input id="cmp-units" inputMode="decimal" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="যেমন: 120" />
        </div>
        <div className="space-y-2">
          <Label>ইউনিয়ন</Label>
          <Select value={unionName} onValueChange={setUnionName}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNIONS.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>মাস</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BN_MONTHS_FULL.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>বছর</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>{toBanglaDigits(y)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          disabled={!canSubmit || mut.isPending}
          onClick={() =>
            mut.mutate({
              amount: Number(amount),
              units: Number(units),
              union_name: unionName,
              bill_year: Number(year),
              bill_month: Number(month),
            })
          }
        >
          {mut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> হিসাব করা হচ্ছে…</> : "তুলনা করুন"}
        </Button>
        {mut.isError && <span className="text-sm text-destructive">তুলনা করা যায়নি। আবার চেষ্টা করুন।</span>}
      </div>

      {mut.data && <VerdictPanel result={mut.data} unionName={unionName} month={Number(month)} year={Number(year)} />}
    </Card>
  );
}

function VerdictPanel({ result, unionName, month, year }: { result: CompareResult; unionName: string; month: number; year: number }) {
  const cfg = verdictConfig(result.verdict);
  const Icon = cfg.icon;

  const scopeLabel = ({
    union_month: `${unionLabel(unionName)} • ${BN_MONTHS_FULL[month - 1]} ${toBanglaDigits(year)}`,
    union: `${unionLabel(unionName)} (সব সময়)`,
    month: `${BN_MONTHS_FULL[month - 1]} ${toBanglaDigits(year)} (সব ইউনিয়ন)`,
    all: "সামগ্রিক (সব ইউনিয়ন, সব সময়)",
  } as const)[result.benchmark_scope];

  return (
    <div className={`mt-5 rounded-lg border p-4 ${cfg.wrap}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 shrink-0 ${cfg.iconColor}`} />
        <div className="flex-1">
          <p className={`font-semibold ${cfg.text}`}>{cfg.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            আপনার বিল গড়ের চেয়ে{" "}
            <span className={cfg.text}>
              {formatPct(result.amount_diff_pct)}
            </span>
            , ইউনিট গড়ের চেয়ে{" "}
            <span className={cfg.text}>{formatPct(result.units_diff_pct)}</span>।
          </p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <div>এলাকার গড় বিল: <span className="font-medium text-foreground">{formatBanglaCurrency(result.benchmark_avg_amount)}</span></div>
            <div>এলাকার গড় ইউনিট: <span className="font-medium text-foreground">{toBanglaDigits(result.benchmark_avg_units.toFixed(1))} kWh</span></div>
            <div>নমুনা: <span className="font-medium text-foreground">{toBanglaDigits(result.benchmark_sample)}টি বিল</span></div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">তুলনার পরিসর: {scopeLabel}</p>
        </div>
      </div>
    </div>
  );
}

function verdictConfig(v: CompareResult["verdict"]) {
  switch (v) {
    case "normal":
      return { icon: CircleCheck, label: "🟢 স্বাভাবিক", iconColor: "text-secondary", text: "text-secondary", wrap: "border-secondary/30 bg-secondary/5" };
    case "higher":
      return { icon: TriangleAlert, label: "🟡 গড়ের চেয়ে বেশি", iconColor: "text-warning", text: "text-warning", wrap: "border-warning/30 bg-warning/5" };
    case "unusual":
      return { icon: OctagonAlert, label: "🔴 অস্বাভাবিক", iconColor: "text-destructive", text: "text-destructive", wrap: "border-destructive/30 bg-destructive/5" };
  }
}

function formatPct(pct: number) {
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${toBanglaDigits(Math.abs(pct).toFixed(1))}%`;
}

/* ---------------------------------- Stats --------------------------------- */

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-72 w-full">{children}</div>
    </Card>
  );
}

/* ---------------------------------- Charts -------------------------------- */

type MonthlyPoint = { key: string; year: number; month: number; avg_amount: number; avg_units: number };

function useMonthlyLabels(data: MonthlyPoint[]) {
  return useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: `${BN_MONTHS_FULL[d.month - 1].slice(0, 3)} ${toBanglaDigits(String(d.year).slice(2))}`,
        avg_amount: Number(d.avg_amount.toFixed(2)),
        avg_units: Number(d.avg_units.toFixed(2)),
      })),
    [data],
  );
}

function MonthlyAmountChart({ data }: { data: MonthlyPoint[] }) {
  const rows = useMonthlyLabels(data);
  if (!rows.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => toBanglaDigits(v)} />
        <Tooltip
          formatter={(v: number) => [formatBanglaCurrency(v), "গড় বিল"]}
          labelFormatter={(l) => `মাস: ${l}`}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend formatter={() => "গড় বিল (৳)"} />
        <Line type="monotone" dataKey="avg_amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MonthlyUnitsChart({ data }: { data: MonthlyPoint[] }) {
  const rows = useMonthlyLabels(data);
  if (!rows.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => toBanglaDigits(v)} />
        <Tooltip
          formatter={(v: number) => [`${toBanglaDigits(v.toFixed(1))} kWh`, "গড় ইউনিট"]}
          labelFormatter={(l) => `মাস: ${l}`}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend formatter={() => "গড় ইউনিট (kWh)"} />
        <Line type="monotone" dataKey="avg_units" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

type UnionRow = { union_name: string; avg_amount: number; avg_units: number };

function UnionAmountChart({ data }: { data: UnionRow[] }) {
  const rows = useMemo(
    () => data.map((d) => ({ ...d, label: unionLabel(d.union_name), avg_amount: Number(d.avg_amount.toFixed(2)) })),
    [data],
  );
  if (!rows.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => toBanglaDigits(v)} />
        <Tooltip formatter={(v: number) => [formatBanglaCurrency(v), "গড় বিল"]} contentStyle={{ fontSize: 12 }} />
        <Legend formatter={() => "গড় বিল (৳)"} />
        <Bar dataKey="avg_amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function UnionUnitsChart({ data }: { data: UnionRow[] }) {
  const rows = useMemo(
    () => data.map((d) => ({ ...d, label: unionLabel(d.union_name), avg_units: Number(d.avg_units.toFixed(2)) })),
    [data],
  );
  if (!rows.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => toBanglaDigits(v)} />
        <Tooltip formatter={(v: number) => [`${toBanglaDigits(v.toFixed(1))} kWh`, "গড় ইউনিট"]} contentStyle={{ fontSize: 12 }} />
        <Legend formatter={() => "গড় ইউনিট (kWh)"} />
        <Bar dataKey="avg_units" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      পর্যাপ্ত তথ্য নেই — কিছু বিল জমা হলে চার্ট প্রদর্শিত হবে।
    </div>
  );
}
