import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Globe2, Plane, Search, UserPlus } from "lucide-react";
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
import { ProbashiCard } from "@/components/probashi/ProbashiCard";
import { ProbashiStats, CountryBreakdown, CityBreakdown } from "@/components/probashi/ProbashiStats";
import { BirthdayStrip, CommunityMessages } from "@/components/probashi/CommunityMessages";
import { useApprovedProbashi } from "@/components/probashi/use-probashi";
import {
  PROBASHI_COUNTRIES,
  UKHIYA_UNIONS_PROBASHI,
  countryMeta,
  presenceOf,
  toBanglaDigits,
} from "@/lib/probashi-shared";

export const Route = createFileRoute("/probashi/")({
  head: () => ({
    meta: [
      { title: "প্রবাসী কর্নার — উখিয়ার প্রবাসীদের ডিরেক্টরি | উখিয়া সেবা" },
      {
        name: "description",
        content:
          "উখিয়ার প্রবাসীদের তালিকা — কে কোন দেশে আছেন, কবে দেশে ফিরছেন, তাদের বার্তা ও জন্মদিন। প্রবাসী কর্নারে বিনামূল্যে যুক্ত হোন।",
      },
      { property: "og:title", content: "প্রবাসী কর্নার — উখিয়ার প্রবাসীদের ডিরেক্টরি" },
      {
        property: "og:description",
        content: "উখিয়ার প্রবাসীদের দেশ, শহর, পেশা ও দেশে ফেরার তারিখ—সব এক জায়গায়।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProbashiDirectory,
});

function ProbashiDirectory() {
  const { data, isLoading, error } = useApprovedProbashi();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");
  const [village, setVillage] = useState("all");
  const [presence, setPresence] = useState("all");

  const list = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((p) => {
      if (country !== "all" && countryMeta(p.country).name !== country) return false;
      if (village !== "all" && (p.village ?? "") !== village) return false;
      if (presence !== "all" && presenceOf(p) !== presence) return false;
      if (!needle) return true;
      return [p.full_name, p.city, p.village, p.profession, countryMeta(p.country).bn, p.country]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [list, q, country, village, presence]);

  return (
    <div className="min-h-screen">
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 opacity-95" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="mx-auto max-w-6xl px-4 py-12 text-white sm:px-6 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Globe2 className="h-3.5 w-3.5" /> উখিয়া সেবা · নতুন মডিউল
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">🌍 প্রবাসী কর্নার</h1>
          <p className="mt-3 max-w-2xl text-base text-white/90">
            উখিয়ার প্রবাসী ভাই-বোনদের একটি ডিজিটাল ঠিকানা — কে কোথায় আছেন, কবে দেশে ফিরছেন, এবং
            এলাকার জন্য তাদের বার্তা।
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 bg-white px-6 text-primary hover:bg-white/90">
              <Link to="/probashi/register">
                <UserPlus className="mr-2 h-4 w-4" /> প্রবাসী হিসেবে যুক্ত হোন
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <ProbashiStats list={list} />
        <BirthdayStrip list={list} />

        <Card className="border-border/60 bg-card/70 p-4 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="নাম, শহর বা পেশা খুঁজুন…"
                className="pl-9"
                aria-label="প্রবাসী খুঁজুন"
              />
            </div>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger aria-label="দেশ"><SelectValue placeholder="দেশ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব দেশ</SelectItem>
                {PROBASHI_COUNTRIES.map((c) => (
                  <SelectItem key={c.iso} value={c.name}>{c.bn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={village} onValueChange={setVillage}>
              <SelectTrigger aria-label="ইউনিয়ন"><SelectValue placeholder="ইউনিয়ন" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ইউনিয়ন</SelectItem>
                {UKHIYA_UNIONS_PROBASHI.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={presence} onValueChange={setPresence}>
              <SelectTrigger aria-label="অবস্থান"><SelectValue placeholder="অবস্থান" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সবাই</SelectItem>
                <SelectItem value="abroad">বর্তমানে প্রবাসে</SelectItem>
                <SelectItem value="home">বর্তমানে বাংলাদেশে</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Plane className="h-5 w-5 text-primary" /> প্রবাসী তালিকা
            </h2>
            <span className="text-sm text-muted-foreground">{toBanglaDigits(filtered.length)} জন</span>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-40 animate-pulse bg-muted/40" />
              ))}
            </div>
          ) : error ? (
            <Card className="p-8 text-center text-sm text-destructive">তালিকা লোড করা যায়নি। পরে আবার চেষ্টা করুন।</Card>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm text-muted-foreground">এই ফিল্টারে কোনো প্রবাসী পাওয়া যায়নি।</p>
              <Button asChild className="mt-4">
                <Link to="/probashi/register">প্রথম প্রবাসী হিসেবে যুক্ত হোন</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProbashiCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>

        <CommunityMessages list={list} />

        <div className="grid gap-4 lg:grid-cols-2">
          <CountryBreakdown list={list} />
          <CityBreakdown list={list} />
        </div>
      </div>
    </div>
  );
}
