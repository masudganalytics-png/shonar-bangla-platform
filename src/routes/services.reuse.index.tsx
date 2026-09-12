import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Recycle, Search, PlusCircle, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReuseCard } from "@/components/reuse/ReuseCard";
import { useReuseListings } from "@/components/reuse/use-reuse";
import { REUSE_AREAS, REUSE_CATEGORIES, REUSE_PAGE_SIZE, REUSE_TAGLINE } from "@/lib/reuse-shared";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/services/reuse/")({
  head: () => ({
    meta: [
      { title: "KHIJIRION Reuse — ব্যবহৃত পণ্য কিনুন, বিক্রি করুন বা দান করুন" },
      {
        name: "description",
        content: "উখিয়ার স্থানীয় ব্যবহৃত পণ্যের বাজার — পুরনো জিনিস বিক্রি করুন, কিনুন অথবা প্রয়োজনে দান করুন।",
      },
      { property: "og:title", content: "KHIJIRION Reuse — ব্যবহৃত পণ্যের স্থানীয় বাজার" },
      { property: "og:description", content: "ব্যবহৃত পণ্য কিনুন, বিক্রি করুন বা দান করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReuseIndex,
});

function ReuseIndex() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [listingType, setListingType] = useState("all");
  const [area, setArea] = useState("all");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useReuseListings({
    q,
    category,
    listingType,
    area,
    page,
    pageSize: REUSE_PAGE_SIZE,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / REUSE_PAGE_SIZE) - 1);

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
            <Recycle className="h-3.5 w-3.5" /> স্থানীয় পুনঃব্যবহার প্ল্যাটফর্ম
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">♻️ KHIJIRION Reuse</h1>
          <p className="mt-3 max-w-2xl text-base text-white/90">{REUSE_TAGLINE}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/services/reuse/create">
                <PlusCircle className="mr-2 h-4 w-4" /> বিজ্ঞাপন দিন
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20">
              <Link to="/services/reuse/my-listings">
                <ListChecks className="mr-2 h-4 w-4" /> আমার বিজ্ঞাপন
              </Link>
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
                placeholder="পণ্যের নাম বা এলাকা খুঁজুন…"
                className="pl-9"
                aria-label="পণ্য খুঁজুন"
              />
            </div>
            <Select value={category} onValueChange={reset(setCategory)}>
              <SelectTrigger aria-label="ক্যাটাগরি"><SelectValue placeholder="ক্যাটাগরি" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
                {REUSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={listingType} onValueChange={reset(setListingType)}>
              <SelectTrigger aria-label="ধরন"><SelectValue placeholder="ধরন" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">বিক্রয় ও দান</SelectItem>
                <SelectItem value="sale">🏷️ বিক্রয়</SelectItem>
                <SelectItem value="donation">🤝 দান</SelectItem>
              </SelectContent>
            </Select>
            <Select value={area} onValueChange={reset(setArea)}>
              <SelectTrigger aria-label="এলাকা"><SelectValue placeholder="এলাকা" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব এলাকা</SelectItem>
                {REUSE_AREAS.map((a) => (
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
            এই ফিল্টারে কোনো পণ্য পাওয়া যায়নি।
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">মোট {toBanglaDigits(total)} টি পণ্য</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {rows.map((item) => (
                <ReuseCard key={item.id} item={item} />
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
      </div>
    </div>
  );
}
