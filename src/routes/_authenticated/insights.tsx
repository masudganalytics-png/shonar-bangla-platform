import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, AlertTriangle, Brain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toBanglaDigits, formatBanglaCurrency } from "@/lib/bangla";
import { BN_MONTHS_FULL } from "@/lib/bills-constants";
import { getBillInsights } from "@/lib/insights.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "AI বিশ্লেষণ — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "AI-চালিত পূর্বাভাস, অস্বাভাবিক বিল সনাক্তকরণ এবং মাসিক অন্তর্দৃষ্টি।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InsightsPage,
});

type InsightsResult = Awaited<ReturnType<typeof getBillInsights>>;

function InsightsPage() {
  const fetchInsights = useServerFn(getBillInsights);
  const [data, setData] = useState<InsightsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchInsights({ data: { months: 12 } })
      .then((r) => { if (alive) setData(r); })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e.message : "লোড করতে ব্যর্থ"); });
    return () => { alive = false; };
  }, [fetchInsights]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI বিল বিশ্লেষক</h1>
            <p className="text-sm text-muted-foreground">পূর্বাভাস · অস্বাভাবিকতা সনাক্তকরণ · মাসিক অন্তর্দৃষ্টি</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>সমস্যা</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!data && !error && (
          <div className="grid gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
            <Skeleton className="h-40" />
          </div>
        )}

        {data && !data.hasData && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">{data.message}</CardContent>
          </Card>
        )}

        {data && data.hasData && (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" /> পরবর্তী মাসের পূর্বাভাস
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{formatBanglaCurrency(data.prediction.amount)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {BN_MONTHS_FULL[data.prediction.month - 1]} {toBanglaDigits(data.prediction.year)} · আনুমানিক {toBanglaDigits(data.prediction.units)} ইউনিট
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">গড় মাসিক বিল</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatBanglaCurrency(data.stats.avgAmount)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">গড় ইউনিট {toBanglaDigits(data.stats.avgUnits.toFixed(0))}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">অস্বাভাবিক বিল</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{toBanglaDigits(data.anomalies.length)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">গত {toBanglaDigits(data.history.length)} মাসে</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> AI অন্তর্দৃষ্টি</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed">{data.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">ট্রেন্ড ও পূর্বাভাস</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={[
                      ...data.history.map((p) => ({
                        name: `${BN_MONTHS_FULL[p.month - 1].slice(0, 3)} ${toBanglaDigits(String(p.year).slice(-2))}`,
                        amount: p.amount,
                      })),
                      { name: "পূর্বাভাস", amount: data.prediction.amount, forecast: true },
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) => formatBanglaCurrency(v)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {data.anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-amber-500" /> অস্বাভাবিক বিল সনাক্ত হয়েছে</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {data.anomalies.map((a, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-lg border p-3">
                        <Badge variant={a.severity === "high" ? "destructive" : "secondary"}>
                          {a.severity === "high" ? "উচ্চ" : "মাঝারি"}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium">
                            {BN_MONTHS_FULL[a.month - 1]} {toBanglaDigits(a.year)} — {formatBanglaCurrency(a.amount)} ({toBanglaDigits(a.units.toFixed(0))} ইউনিট)
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{a.reason}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
