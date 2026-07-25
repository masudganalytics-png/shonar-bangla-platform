import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CircleCheck, TriangleAlert, OctagonAlert, Loader2, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compareMyBill } from "@/lib/analytics.functions";
import type { CompareResult } from "@/lib/analytics.functions";
import { formatBanglaCurrency, toBanglaDigits } from "@/lib/bangla";
import { UNIONS } from "@/lib/bills-constants";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({
    meta: [
      { title: "বিল তুলনা — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "এলাকার গড়ের সাথে আপনার বিদ্যুৎ বিল তুলনা করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const compareFn = useServerFn(compareMyBill);
  const [amount, setAmount] = useState("");
  const [units, setUnits] = useState("");
  const [unionName, setUnionName] = useState<string>(UNIONS[0].value);
  const now = new Date();

  const mut = useMutation({
    mutationFn: () =>
      compareFn({
        data: {
          amount: Number(amount),
          units: Number(units),
          union_name: unionName,
          bill_year: now.getFullYear(),
          bill_month: now.getMonth() + 1,
        },
      }),
  });

  const canSubmit = Number(amount) > 0 && Number(units) > 0 && unionName;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Scale className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">আপনার বিল কি স্বাভাবিক?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          এলাকার গড়ের সাথে তুলনা — অন্য কোনো গ্রাহকের ব্যক্তিগত তথ্য কখনও প্রকাশ করা হয় না।
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">তথ্য দিন</CardTitle>
          <CardDescription>আপনার বিলের পরিমাণ, ইউনিট এবং ইউনিয়ন নির্বাচন করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) mut.mutate();
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="cmp-amount">আপনার বিল (৳)</Label>
              <Input
                id="cmp-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="যেমন: ৮৫০"
                className="h-14 text-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cmp-units">ব্যবহৃত ইউনিট (kWh)</Label>
              <Input
                id="cmp-units"
                inputMode="decimal"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="যেমন: ১২০"
                className="h-14 text-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ইউনিয়ন</Label>
              <Select value={unionName} onValueChange={setUnionName}>
                <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={!canSubmit || mut.isPending}>
              {mut.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> হিসাব করা হচ্ছে…</>
              ) : (
                "তুলনা করুন"
              )}
            </Button>
            {mut.isError && <p className="text-sm text-destructive">তুলনা করা যায়নি। আবার চেষ্টা করুন।</p>}
          </form>
        </CardContent>
      </Card>

      {mut.data && <VerdictPanel result={mut.data} yourAmount={Number(amount)} />}
    </div>
  );
}

function VerdictPanel({ result, yourAmount }: { result: CompareResult; yourAmount: number }) {
  const cfg = verdictConfig(result.verdict);
  const Icon = cfg.icon;
  return (
    <Card className={`mt-6 border ${cfg.wrap}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <Icon className={`h-8 w-8 shrink-0 ${cfg.iconColor}`} />
          <div className="flex-1">
            <p className={`text-lg font-semibold ${cfg.text}`}>{cfg.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              আপনার বিল এলাকার গড়ের চেয়ে{" "}
              <span className={cfg.text}>{formatPct(result.amount_diff_pct)}</span>।
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-border rounded-lg border border-border/60 bg-card p-3 text-center text-sm">
          <div>
            <p className="text-xs text-muted-foreground">আপনার বিল</p>
            <p className="mt-1 font-bold">{formatBanglaCurrency(yourAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">এলাকার গড়</p>
            <p className="mt-1 font-bold">{formatBanglaCurrency(result.benchmark_avg_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">পার্থক্য</p>
            <p className={`mt-1 font-bold ${cfg.text}`}>{formatPct(result.amount_diff_pct)}</p>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          তুলনার নমুনা: {toBanglaDigits(result.benchmark_sample)}টি বিল
        </p>
      </CardContent>
    </Card>
  );
}

function verdictConfig(v: CompareResult["verdict"]) {
  switch (v) {
    case "normal":
      return { icon: CircleCheck, label: "🟢 স্বাভাবিক", iconColor: "text-secondary", text: "text-secondary", wrap: "border-secondary/40 bg-secondary/5" };
    case "higher":
      return { icon: TriangleAlert, label: "🟡 গড়ের চেয়ে বেশি", iconColor: "text-warning", text: "text-warning", wrap: "border-warning/40 bg-warning/5" };
    case "unusual":
      return { icon: OctagonAlert, label: "🔴 অস্বাভাবিক", iconColor: "text-destructive", text: "text-destructive", wrap: "border-destructive/40 bg-destructive/5" };
  }
}

function formatPct(pct: number) {
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${toBanglaDigits(Math.abs(pct).toFixed(1))}%`;
}
