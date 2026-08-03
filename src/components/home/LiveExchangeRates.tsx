import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CountryFlag } from "@/components/common/CountryFlag";
import {
  RATE_STATUS_META,
  formatRate,
  formatUpdatedAt,
  isoForRate,
  toBanglaDigits,
  type ExchangeRateRow,
} from "@/lib/exchange-shared";

function useExchangeRates() {
  return useQuery({
    queryKey: ["exchange-rates"],
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<ExchangeRateRow[]> => {
      const { data, error } = await supabase
        .from("exchange_rates")
        .select(
          "id, country_name, country_name_bn, flag_emoji, flag_url, currency_name, currency_code, exchange_rate_to_bdt, previous_rate, rate_status, sort_order, last_updated",
        )
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExchangeRateRow[];
    },
  });
}

function RateCard({ r }: { r: ExchangeRateRow }) {
  const meta = RATE_STATUS_META[r.rate_status] ?? RATE_STATUS_META.stable;
  return (
    <Card className="min-w-[13rem] shrink-0 snap-start border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--shadow-lg)] dark:border-white/10 dark:bg-white/5 sm:min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CountryFlag src={r.flag_url} iso={isoForRate(r)} countryName={r.country_name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{r.country_name_bn}</p>
            <p className="truncate text-xs text-muted-foreground">
              {r.currency_name} • {r.currency_code}
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium ${meta.className}`} title={meta.label}>
          {meta.dot}
        </span>
      </div>


      <p className="mt-3 text-2xl font-bold tracking-tight">
        ৳ {formatRate(Number(r.exchange_rate_to_bdt))}
      </p>
      <p className={`mt-0.5 text-xs font-medium ${meta.className}`}>{meta.label}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        হালনাগাদ: {formatUpdatedAt(r.last_updated)}
      </p>
    </Card>
  );
}

function Calculator({ rates }: { rates: ExchangeRateRow[] }) {
  const [code, setCode] = useState(rates[0]?.currency_code ?? "SAR");
  const [amount, setAmount] = useState("100");

  const selected = rates.find((r) => r.currency_code === code) ?? rates[0];
  const result = useMemo(() => {
    const n = Number(amount.replace(/[^\d.]/g, ""));
    if (!selected || !Number.isFinite(n)) return 0;
    return n * Number(selected.exchange_rate_to_bdt);
  }, [amount, selected]);

  if (!selected) return null;

  return (
    <Card className="mt-6 border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">মুদ্রা ক্যালকুলেটর</h3>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="exchange-currency" className="text-xs">
            মুদ্রা নির্বাচন করুন
          </Label>
          <Select value={code} onValueChange={setCode}>
            <SelectTrigger id="exchange-currency" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rates.map((r) => (
                <SelectItem key={r.currency_code} value={r.currency_code}>
                  {r.flag_emoji} {r.country_name_bn} — {r.currency_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="exchange-amount" className="text-xs">
            পরিমাণ
          </Label>
          <Input
            id="exchange-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="১০০"
            className="mt-1.5"
          />
        </div>
        <div className="rounded-xl bg-primary/10 px-4 py-3 text-center sm:text-left">
          <p className="text-xs text-muted-foreground">বাংলাদেশি টাকা</p>
          <p className="text-xl font-bold text-primary">৳ {formatRate(result)}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        ১ {selected.currency_code} = ৳ {formatRate(Number(selected.exchange_rate_to_bdt))} • সর্বশেষ
        সংরক্ষিত রেট অনুযায়ী হিসাব
      </p>
    </Card>
  );
}

export function LiveExchangeRates() {
  const { data, isLoading, isError } = useExchangeRates();
  const rates = data ?? [];

  return (
    <section
      aria-labelledby="exchange-rates-heading"
      className="border-b bg-gradient-to-br from-primary/5 via-background to-emerald-500/5"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="exchange-rates-heading" className="text-xl font-bold sm:text-2xl">
            💱 লাইভ বৈদেশিক মুদ্রার হার
          </h2>
          {rates[0] ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              প্রতি {toBanglaDigits("4")} ঘণ্টায় হালনাগাদ
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          প্রবাসী ভাইদের জন্য বাংলাদেশি টাকায় আজকের আনুমানিক বিনিময় হার।
        </p>

        {isLoading ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : isError || rates.length === 0 ? (
          <Card className="mt-5 p-6 text-center text-sm text-muted-foreground">
            এই মুহূর্তে বিনিময় হার দেখানো যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।
          </Card>
        ) : (
          <>
            <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {rates.map((r) => (
                <RateCard key={r.id} r={r} />
              ))}
            </div>
            <Calculator rates={rates} />
            <p className="mt-3 text-[11px] text-muted-foreground">
              দ্রষ্টব্য: হারগুলো তথ্যগত উদ্দেশ্যে; ব্যাংক বা এক্সচেঞ্জ হাউসের প্রকৃত হার ভিন্ন হতে পারে।
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default LiveExchangeRates;
