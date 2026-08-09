import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Plus, Search, BadgeCheck, User2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listMosques, getMosqueFilterOptions } from "@/lib/mosque.functions";
import { mosquePath } from "@/lib/mosque-shared";
import type { MosqueListItem } from "@/lib/mosque-shared";

export const Route = createFileRoute("/community/mosques/")({
  head: () => ({
    meta: [
      { title: "মসজিদ ও সমাজ — কমিউনিটি | উখিয়া সেবা" },
      {
        name: "description",
        content:
          "আপনার এলাকার মসজিদ, মসজিদ কমিটি, ইমাম-মুয়াজ্জিন, সমাজপতি, সমাজের সদস্য ও দাতা-সহযোগীদের তথ্য এক জায়গায় খুঁজুন।",
      },
      { property: "og:title", content: "মসজিদ ও সমাজ — উখিয়া সেবা" },
      { property: "og:description", content: "এলাকার মসজিদ কমিটি ও সমাজের তথ্য দেখুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MosqueListPage,
});

const ALL = "__all__";

function MosqueListPage() {
  const fetchList = useServerFn(listMosques);
  const fetchOptions = useServerFn(getMosqueFilterOptions);

  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState(ALL);
  const [upazila, setUpazila] = useState(ALL);
  const [unionName, setUnionName] = useState(ALL);

  const optionsQ = useQuery({
    queryKey: ["mosque-filter-options"],
    queryFn: () => fetchOptions(),
  });

  const listQ = useQuery({
    queryKey: ["mosques", q, district, upazila, unionName],
    queryFn: (): Promise<MosqueListItem[]> =>
      fetchList({
        data: {
          q: q || undefined,
          district: district === ALL ? undefined : district,
          upazila: upazila === ALL ? undefined : upazila,
          union_name: unionName === ALL ? undefined : unionName,
          limit: 60,
        },
      }),
  });

  const rows = listQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">🕌 মসজিদ ও সমাজ</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            আপনার এলাকার মসজিদ, কমিটি, সমাজপতি, সমাজের সদস্য ও দাতা-সহযোগীদের তথ্য এক জায়গায়।
          </p>
        </div>
        <Button asChild>
          <Link to="/community/mosques/new">
            <Plus className="mr-2 h-4 w-4" /> তথ্য যোগ করুন
          </Link>
        </Button>
      </div>

      {/* Search + filters */}
      <Card className="mt-6 p-4">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(term.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="মসজিদের নাম, গ্রাম/এলাকা, ইউনিয়ন বা সমাজপতির নাম"
              className="pl-9"
              aria-label="মসজিদ সার্চ"
            />
          </div>
          <Button type="submit" className="sm:w-32">
            খুঁজুন
          </Button>
        </form>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger aria-label="জেলা">
              <SelectValue placeholder="জেলা" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব জেলা</SelectItem>
              {(optionsQ.data?.districts ?? []).map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={upazila} onValueChange={setUpazila}>
            <SelectTrigger aria-label="উপজেলা">
              <SelectValue placeholder="উপজেলা" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব উপজেলা</SelectItem>
              {(optionsQ.data?.upazilas ?? []).map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={unionName} onValueChange={setUnionName}>
            <SelectTrigger aria-label="ইউনিয়ন">
              <SelectValue placeholder="ইউনিয়ন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব ইউনিয়ন</SelectItem>
              {(optionsQ.data?.unions ?? []).map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {listQ.isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">এখনো কোনো যাচাইকৃত মসজিদের তথ্য পাওয়া যায়নি।</p>
          <Button asChild className="mt-4">
            <Link to="/community/mosques/new">প্রথম তথ্য যোগ করুন</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((m) => (
            <MosqueCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MosqueCard({ m }: { m: MosqueListItem }) {


  const location = [m.area, m.union_name ? `${m.union_name} ইউনিয়ন` : null, m.upazila, m.district]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {m.photo_url ? (
        <img src={m.photo_url} alt={`${m.name} — মসজিদের ছবি`} loading="lazy" className="h-32 w-full object-cover" />
      ) : (
        <div className="grid h-32 w-full place-items-center bg-primary/10 text-4xl">🕌</div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-snug">{m.name}</h3>
          {m.status === "verified" ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="h-3.5 w-3.5" /> যাচাইকৃত
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              যাচাইাধীন
            </span>
          )}
        </div>
        <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {location || "ঠিকানা যোগ করা হয়নি"}
        </p>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            <User2 className="h-3.5 w-3.5 shrink-0" /> ইমাম: {m.imam_name || "যোগ করা হয়নি"}
          </p>
          <p className="flex items-center gap-1">
            <Volume2 className="h-3.5 w-3.5 shrink-0" /> মুয়াজ্জিন: {m.muazzin_name || "যোগ করা হয়নি"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link to="/community/mosques/$slug" params={{ slug: mosquePath(m) }}>
            বিস্তারিত দেখুন
          </Link>
        </Button>
      </div>
    </Card>
  );
}
