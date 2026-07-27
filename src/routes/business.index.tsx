import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Store, Plus, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { BusinessCategory, BusinessRow } from "@/lib/business-shared";
import { BusinessCard } from "@/components/business/BusinessCard";

export const Route = createFileRoute("/business/")({
  head: () => ({
    meta: [
      { title: "স্থানীয় ব্যবসা — খিজিরিয়ন" },
      { name: "description", content: "উখিয়ার সব স্থানীয় ব্যবসা এক জায়গায়। মুদি, ফার্মেসি, রেস্টুরেন্ট, ব্যাংক, হোটেল ও আরও অনেক কিছু সহজে খুঁজুন।" },
      { property: "og:title", content: "স্থানীয় ব্যবসা — উখিয়া" },
      { property: "og:description", content: "যাচাইকৃত স্থানীয় ব্যবসার তালিকা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessHome,
});

function BusinessHome() {
  const catsQ = useQuery({
    queryKey: ["biz-categories"],
    queryFn: async (): Promise<BusinessCategory[]> => {
      const { data, error } = await supabase.from("business_categories").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data as BusinessCategory[];
    },
  });

  const bizQ = useQuery({
    queryKey: ["biz-home"],
    queryFn: async (): Promise<BusinessRow[]> => {
      const { data, error } = await supabase.from("businesses").select("*")
        .eq("status", "approved").order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(24);
      if (error) throw error;
      return data as BusinessRow[];
    },
  });

  const groups = useMemo(() => {
    const map = new Map<string, BusinessCategory[]>();
    for (const c of catsQ.data ?? []) {
      if (!map.has(c.group_bn)) map.set(c.group_bn, []);
      map.get(c.group_bn)!.push(c);
    }
    return Array.from(map.entries());
  }, [catsQ.data]);

  const featured = (bizQ.data ?? []).filter((b) => b.is_featured);
  const latest = (bizQ.data ?? []).slice(0, 12);
  const catName = (id: string | null) => catsQ.data?.find((c) => c.id === id)?.name_bn ?? undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 sm:p-10">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">স্থানীয় ব্যবসা ডিরেক্টরি</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">উখিয়ার সব ব্যবসা, এক জায়গায়</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              মুদি, ফার্মেসি, রেস্টুরেন্ট, বিকাশ এজেন্ট, হোটেল, নার্সারি ও আরও অনেক কিছু — স্থানীয় ব্যবসা সহজে খুঁজুন ও যোগাযোগ করুন।
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="lg">
              <Link to="/business/directory"><Search className="mr-2 h-4 w-4" /> সব ব্যবসা</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/business/register"><Plus className="mr-2 h-4 w-4" /> আপনার ব্যবসা যোগ করুন</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">ক্যাটাগরি অনুযায়ী দেখুন</h2>
        {catsQ.isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {groups.map(([group, cats]) => (
              <div key={group}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{group}</h3>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {cats.map((c) => (
                    <Link
                      key={c.id}
                      to="/business/directory"
                      search={{ category: c.slug }}
                      className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-sm"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-lg">{c.icon || "🏷️"}</span>
                      <span className="flex-1 text-sm font-medium">{c.name_bn}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">ফিচার্ড ব্যবসা</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((b) => <BusinessCard key={b.id} b={b} categoryName={catName(b.category_id)} />)}
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">সর্বশেষ যুক্ত হয়েছে</h2>
        {bizQ.isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : latest.length === 0 ? (
          <Card className="mt-4 p-8 text-center">
            <Store className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">এখনো কোন ব্যবসা যোগ করা হয়নি।</p>
            <Button asChild className="mt-4"><Link to="/business/register">প্রথম ব্যবসা যোগ করুন</Link></Button>
          </Card>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((b) => <BusinessCard key={b.id} b={b} categoryName={catName(b.category_id)} />)}
          </div>
        )}
      </section>
    </div>
  );
}
