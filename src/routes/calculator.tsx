import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateBill, fetchTariffSlabs } from "@/lib/tariff";
import { formatBanglaCurrency, toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "বিদ্যুৎ বিল ক্যালকুলেটর — উখিয়া বিদ্যুৎ বিল" },
      {
        name: "description",
        content: "মাসিক ব্যবহৃত ইউনিটের ভিত্তিতে আপনার আনুমানিক বিদ্যুৎ বিল হিসাব করুন।",
      },
      { property: "og:title", content: "বিদ্যুৎ বিল ক্যালকুলেটর" },
      { property: "og:description", content: "সহজে আপনার আনুমানিক মাসিক বিদ্যুৎ বিল হিসাব করুন।" },
    ],
  }),
  component: CalculatorPage,
});

const METER_TYPES = [
  { value: "prepaid", label: "প্রিপেইড" },
  { value: "postpaid", label: "পোস্টপেইড" },
] as const;

const PROVIDERS = [
  { value: "REB", label: "বাংলাদেশ পল্লী বিদ্যুতায়ন বোর্ড (BREB)" },
] as const;

function CalculatorPage() {
  const [provider, setProvider] = useState<string>("REB");
  const [meterType, setMeterType] = useState<string>("postpaid");
  const [unitsInput, setUnitsInput] = useState<string>("");
  const [submittedUnits, setSubmittedUnits] = useState<number | null>(null);

  const slabsQ = useQuery({
    queryKey: ["tariff", provider, meterType],
    queryFn: () => fetchTariffSlabs(provider, meterType),
    staleTime: 5 * 60_000,
  });

  const result = useMemo(() => {
    if (submittedUnits == null || !slabsQ.data) return null;
    return calculateBill(submittedUnits, slabsQ.data);
  }, [submittedUnits, slabsQ.data]);

  const onCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(unitsInput);
    if (!Number.isFinite(n) || n < 0) return;
    setSubmittedUnits(n);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Calculator className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">বিদ্যুৎ বিল ক্যালকুলেটর</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          আপনার মাসিক ব্যবহৃত ইউনিট (kWh) দিয়ে আনুমানিক বিল হিসাব করুন।
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">তথ্য দিন</CardTitle>
          <CardDescription>মিটারের ধরন ও ইউনিট নির্বাচন করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCalculate} className="space-y-5">
            <div className="space-y-2">
              <Label>বিদ্যুৎ সরবরাহকারী</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>মিটারের ধরন</Label>
              <Select value={meterType} onValueChange={setMeterType}>
                <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METER_TYPES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="units">মাসিক ব্যবহৃত ইউনিট (kWh)</Label>
              <Input
                id="units"
                inputMode="decimal"
                value={unitsInput}
                onChange={(e) => setUnitsInput(e.target.value)}
                placeholder="যেমন: ১৫০"
                className="h-14 text-lg"
                required
              />
            </div>

            <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={slabsQ.isLoading}>
              {slabsQ.isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে…</>
              ) : (
                <><Zap className="mr-2 h-5 w-5" /> বিল হিসাব করুন</>
              )}
            </Button>

            {slabsQ.isError && (
              <p className="text-sm text-destructive">
                ট্যারিফ তথ্য লোড করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <ResultStat label="আনুমানিক মোট বিল" value={formatBanglaCurrency(result.total)} highlight />
            <ResultStat label="মোট ব্যবহৃত ইউনিট" value={`${toBanglaDigits(result.units.toFixed(0))} kWh`} />
            <ResultStat label="প্রতি ইউনিট গড় খরচ" value={formatBanglaCurrency(result.effective_rate)} />
          </CardContent>
        </Card>
      )}

      {result && result.breakdown.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">স্ল্যাব অনুযায়ী বিস্তারিত</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border text-sm">
              {result.breakdown.map((b, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">
                    {toBanglaDigits(b.slab_min)}–{b.slab_max == null ? "উপরে" : toBanglaDigits(b.slab_max)} ইউনিট
                    <span className="ml-2 text-xs">
                      ({toBanglaDigits(b.units_in_slab.toFixed(0))} × {formatBanglaCurrency(b.rate_per_unit)})
                    </span>
                  </span>
                  <span className="font-medium">{formatBanglaCurrency(b.subtotal)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 rounded-lg border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
        এটি একটি আনুমানিক হিসাব। প্রকৃত বিল বিদ্যুৎ সরবরাহকারী প্রতিষ্ঠানের চূড়ান্ত হিসাব
        (ডিমান্ড চার্জ, ভ্যাট ও অন্যান্য চার্জসহ) অনুযায়ী ভিন্ন হতে পারে।
      </p>
    </div>
  );
}

function ResultStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-bold ${highlight ? "text-2xl text-primary" : "text-lg"}`}>{value}</p>
    </div>
  );
}
