import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, BadgeCheck, Scale, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AdvocatePhoto } from "@/components/legal/AdvocatePhoto";
import { PRACTICE_AREAS, practiceAreaLabel, type AdvocateRow } from "@/lib/legal-shared";

export const Route = createFileRoute("/legal/")({
  head: () => ({
    meta: [
      { title: "আইনি সহায়তা — উখিয়া সেবা" },
      { name: "description", content: "উখিয়ার যাচাইকৃত অ্যাডভোকেটদের সাথে সরাসরি WhatsApp-এ পরামর্শ নিন — জমি, পারিবারিক, ফৌজদারি ও দেওয়ানি মামলা।" },
      { property: "og:title", content: "আইনি সহায়তা — উখিয়া সেবা" },
      { property: "og:description", content: "উখিয়ার যাচাইকৃত অ্যাডভোকেটদের সাথে WhatsApp-এ যোগাযোগ করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LegalDirectory,
});

function LegalDirectory() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("all");

  const advQ = useQuery({
    queryKey: ["advocates", "public"],
    queryFn: async (): Promise<AdvocateRow[]> => {
      const { data, error } = await supabase
        .from("advocates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AdvocateRow[];
    },
  });

  const filtered = useMemo(() => {
    const all = advQ.data ?? [];
    const term = q.trim().toLowerCase();
    return all.filter((a) => {
      if (area !== "all" && !a.practice_areas.includes(area)) return false;
      if (term) {
        const hay = [a.full_name, a.chamber_address, a.bio, ...(a.practice_areas ?? []).map(practiceAreaLabel)].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [advQ.data, q, area]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">আইনি সহায়তা</h1>
            <p className="text-sm text-muted-foreground">যাচাইকৃত অ্যাডভোকেটদের সাথে সরাসরি WhatsApp-এ পরামর্শ নিন।</p>
          </div>
        </div>
      </header>

      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="নাম, দক্ষতা, চেম্বার…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger><SelectValue placeholder="সকল আইনি বিষয়" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল আইনি বিষয়</SelectItem>
              {PRACTICE_AREAS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {advQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          কোনো অ্যাডভোকেট পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Link key={a.id} to="/legal/$id" params={{ id: a.id }} className="group">
              <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
                <div className="flex gap-3 p-4">
                  <AdvocatePhoto path={a.photo_url} alt={a.full_name} className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-semibold">অ্যাডভোকেট {a.full_name}</h3>
                      {a.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                    </div>
                    {a.chamber_address && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> <span className="truncate">{a.chamber_address}</span>
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(a.practice_areas ?? []).slice(0, 3).map((pa) => (
                        <Badge key={pa} variant="outline" className="text-[10px]">{practiceAreaLabel(pa)}</Badge>
                      ))}
                    </div>
                    {typeof a.experience_years === "number" && a.experience_years > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">অভিজ্ঞতা: {a.experience_years}+ বছর</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs">
                  <span className="flex items-center gap-1 text-secondary"><MessageCircle className="h-3 w-3" /> WhatsApp-এ যোগাযোগ</span>
                  <span className="font-medium text-primary group-hover:underline">প্রোফাইল →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        এই প্ল্যাটফর্ম শুধুমাত্র ব্যবহারকারীদের স্বাধীন অ্যাডভোকেটের সাথে সংযুক্ত করে। এটি আইনি পরামর্শ প্রদান করে না বা কোনো আইনি ফলাফলের নিশ্চয়তা দেয় না।
      </p>
    </div>
  );
}
