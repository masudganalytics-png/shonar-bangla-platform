import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Landmark, Search, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GovtCard } from "@/components/govt/GovtCard";
import { useGovtDirectory } from "@/components/govt/use-govt";
import {
  GOVT_DEPARTMENTS,
  GOVT_DISCLAIMER,
  GOVT_DISTRICT_FILTERS,
  GOVT_JOB_CATEGORY_SUGGESTIONS,
  GOVT_PAGE_SIZE,
  UKHIYA_AREAS,
} from "@/lib/govt-shared";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/govt-jobs/")({
  head: () => ({
    meta: [
      { title: "উখিয়ার সরকারি চাকরিজীবী — যাচাইকৃত ডিরেক্টরি | KHIJIRION" },
      {
        name: "description",
        content:
          "উখিয়ার সরকারি চাকরিজীবীদের যাচাইকৃত কমিউনিটি ডিরেক্টরি — দপ্তর, পদবি, কর্মস্থল ও এলাকা অনুযায়ী খুঁজুন।",
      },
      { property: "og:title", content: "উখিয়ার সরকারি চাকরিজীবী — যাচাইকৃত ডিরেক্টরি" },
      {
        property: "og:description",
        content: "দপ্তর, জেলা ও ইউনিয়ন অনুযায়ী উখিয়ার সরকারি চাকরিজীবীদের খুঁজুন।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GovtDirectory,
});

function GovtDirectory() {
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("all");
  const [jobCategory, setJobCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [area, setArea] = useState("all");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useGovtDirectory({
    q,
    department,
    jobCategory,
    district,
    area,
    page,
    pageSize: GOVT_PAGE_SIZE,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / GOVT_PAGE_SIZE) - 1);

  function reset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  return (
    <div className="min-h-screen">
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 opacity-95" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="mx-auto max-w-6xl px-4 py-12 text-white sm:px-6 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> যাচাইকৃত কমিউনিটি ডিরেক্টরি
          </p>
          <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold leading-tight sm:text-4xl">
            <Landmark className="h-8 w-8" /> উখিয়ার সরকারি চাকরিজীবী
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/90">
            উখিয়ার সন্তানরা দেশের বিভিন্ন দপ্তরে যেসব দায়িত্বে আছেন — তাদের পরিচিতি ও নেটওয়ার্কিংয়ের
            একটি উন্মুক্ত প্ল্যাটফর্ম।
          </p>
          <div className="mt-6">
            <Button asChild size="lg" variant="secondary">
              <Link to="/govt-jobs/register">নিবন্ধন করুন</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Card className="border-border/60 bg-card/70 p-4 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                placeholder="নাম, পদবি বা প্রতিষ্ঠান খুঁজুন…"
                className="pl-9"
                aria-label="সরকারি চাকরিজীবী খুঁজুন"
              />
            </div>
            <Select value={department} onValueChange={reset(setDepartment)}>
              <SelectTrigger aria-label="দপ্তর"><SelectValue placeholder="দপ্তর" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব দপ্তর</SelectItem>
                {GOVT_DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jobCategory} onValueChange={reset(setJobCategory)}>
              <SelectTrigger aria-label="চাকরির শ্রেণি"><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব শ্রেণি</SelectItem>
                {GOVT_JOB_CATEGORY_SUGGESTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={district} onValueChange={reset(setDistrict)}>
              <SelectTrigger aria-label="বর্তমান জেলা"><SelectValue placeholder="জেলা" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব জেলা</SelectItem>
                {GOVT_DISTRICT_FILTERS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={area} onValueChange={reset(setArea)}>
              <SelectTrigger aria-label="উখিয়ার এলাকা"><SelectValue placeholder="উখিয়ার এলাকা" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব এলাকা</SelectItem>
                {UKHIYA_AREAS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {isLoading ? (
          <p className="py-16 text-center text-muted-foreground">লোড হচ্ছে…</p>
        ) : error ? (
          <p className="py-16 text-center text-destructive">তথ্য আনা যায়নি। পরে আবার চেষ্টা করুন।</p>
        ) : rows.length === 0 ? (
          <Card className="border-border/60 bg-card/70 p-10 text-center text-muted-foreground backdrop-blur-xl">
            এই ফিল্টারে কোনো প্রোফাইল পাওয়া যায়নি।
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              মোট {toBanglaDigits(total)} জন যাচাইকৃত সদস্য
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((w) => (
                <GovtCard key={w.id} w={w} />
              ))}
            </div>
            {lastPage > 0 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  পূর্ববর্তী
                </Button>
                <span className="text-sm text-muted-foreground">
                  পৃষ্ঠা {toBanglaDigits(page + 1)} / {toBanglaDigits(lastPage + 1)}
                </span>
                <Button variant="outline" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                  পরবর্তী
                </Button>
              </div>
            )}
          </>
        )}

        <p className="rounded-xl border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
          {GOVT_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
