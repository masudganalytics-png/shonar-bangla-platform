import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, BadgeCheck, UserPlus, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CONTACT_LOGIN_HINT, WORKER_PUBLIC_COLUMNS, columnsFor } from "@/lib/public-columns";
import { UPAZILAS, type WorkerRow, type CategoryRow } from "@/lib/workers-shared";
import { WorkerPhoto } from "@/components/workers/WorkerPhoto";

export const Route = createFileRoute("/workers/")({
  head: () => ({
    meta: [
      { title: "কাজের লোক খুঁজুন — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "আপনার এলাকার দক্ষ ইলেকট্রিশিয়ান, প্লাম্বার, রাজমিস্ত্রি ও অন্যান্য কাজের লোক সহজে খুঁজুন।" },
      { property: "og:title", content: "কাজের লোক খুঁজুন" },
      { property: "og:description", content: "আপনার এলাকার দক্ষ কাজের লোকের যাচাইকৃত তালিকা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkersDirectory,
});

function WorkersDirectory() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [upazila, setUpazila] = useState<string>("all");
  const { isAuthenticated, loading: authLoading } = useAuth();

  const catsQ = useQuery({
    queryKey: ["worker-categories"],
    queryFn: async (): Promise<CategoryRow[]> => {
      const { data, error } = await supabase.from("worker_categories").select("*").order("sort_order").order("name_bn");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  const workersQ = useQuery({
    queryKey: ["workers", "public", isAuthenticated],
    enabled: !authLoading,
    queryFn: async (): Promise<WorkerRow[]> => {
      const { data, error } = await supabase
        .from("workers")
        .select(columnsFor(WORKER_PUBLIC_COLUMNS, isAuthenticated))
        .eq("status", "approved")
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as unknown as WorkerRow[];
    },
  });

  const filtered = useMemo(() => {
    const all = workersQ.data ?? [];
    const term = q.trim().toLowerCase();
    return all.filter((w) => {
      if (categoryId !== "all" && w.category_id !== categoryId) return false;
      if (upazila !== "all" && w.upazila !== upazila) return false;
      if (term) {
        const hay = [w.full_name, w.skills, w.area, w.description].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [workersQ.data, q, categoryId, upazila]);

  const catName = (id: string | null) => catsQ.data?.find((c) => c.id === id)?.name_bn ?? "—";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">👷 কাজের লোক খুঁজুন</h1>
          <p className="mt-1 text-sm text-muted-foreground">আপনার এলাকার দক্ষ কাজের লোক সহজে খুঁজুন।</p>
        </div>
        <Button asChild size="sm" className="h-10">
          <Link to="/workers/register"><UserPlus className="mr-2 h-4 w-4" /> কাজ করতে চান? নিবন্ধন করুন</Link>
        </Button>
      </header>

      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="নাম, দক্ষতা, এলাকা…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="সকল ক্যাটাগরি" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল ক্যাটাগরি</SelectItem>
              {(catsQ.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={upazila} onValueChange={setUpazila}>
            <SelectTrigger><SelectValue placeholder="সকল উপজেলা" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল উপজেলা</SelectItem>
              {UPAZILAS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {workersQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          কোনো কাজের লোক পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন অথবা নতুন নিবন্ধনের জন্য অপেক্ষা করুন।
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <Link key={w.id} to="/workers/$id" params={{ id: (w as any).slug || w.id }} className="group">
              <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
                <div className="flex gap-3 p-4">
                  <WorkerPhoto path={w.photo_url} alt={w.full_name} className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-semibold">{w.full_name}</h3>
                      {w.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                    </div>
                    <p className="mt-0.5 text-sm text-primary">{catName(w.category_id)}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {[w.area, w.upazila].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {w.is_available ? (
                        <Badge className="bg-secondary text-secondary-foreground">উপলব্ধ</Badge>
                      ) : (
                        <Badge variant="outline">ব্যস্ত</Badge>
                      )}
                      {typeof w.experience_years === "number" && w.experience_years > 0 && (
                        <Badge variant="outline">{w.experience_years}+ বছর</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {w.phone || CONTACT_LOGIN_HINT}</span>
                  <span className="font-medium text-primary group-hover:underline">প্রোফাইল দেখুন →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
