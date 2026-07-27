import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, Filter, ArrowLeft, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { UPAZILAS, UNIONS_UKHIYA, type BusinessCategory, type BusinessRow, type BusinessHoursRow, isOpenNow } from "@/lib/business-shared";
import { BusinessCard } from "@/components/business/BusinessCard";

const searchSchema = z.object({
  category: z.string().optional(),
  union: z.string().optional(),
  upazila: z.string().optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  open_now: z.boolean().optional(),
  min_rating: z.number().optional(),
});

export const Route = createFileRoute("/business/directory")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "সব ব্যবসা — খিজিরিয়ন" },
      { name: "description", content: "উখিয়ার যাচাইকৃত সব স্থানীয় ব্যবসার সম্পূর্ণ তালিকা। ক্যাটাগরি, ইউনিয়ন ও রেটিং অনুযায়ী ফিল্টার করুন।" },
      { property: "og:title", content: "সব ব্যবসা" },
      { property: "og:description", content: "উখিয়ার স্থানীয় ব্যবসার সম্পূর্ণ ডিরেক্টরি।" },
    ],
  }),
  component: BusinessDirectory,
});

function BusinessDirectory() {
  const search = Route.useSearch();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>(search.category ?? "all");
  const [union, setUnion] = useState<string>(search.union ?? "all");
  const [upazila, setUpazila] = useState<string>(search.upazila ?? "all");
  const [verified, setVerified] = useState<boolean>(search.verified ?? false);
  const [featured, setFeatured] = useState<boolean>(search.featured ?? false);
  const [openNow, setOpenNow] = useState<boolean>(search.open_now ?? false);
  const [minRating, setMinRating] = useState<string>((search.min_rating ?? 0).toString());

  const catsQ = useQuery({
    queryKey: ["biz-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_categories").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data as BusinessCategory[];
    },
  });

  const bizQ = useQuery({
    queryKey: ["biz-directory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as BusinessRow[];
    },
  });

  const hoursQ = useQuery({
    queryKey: ["biz-hours-all"],
    enabled: openNow,
    queryFn: async () => {
      const { data, error } = await supabase.from("business_hours").select("*");
      if (error) throw error;
      return data as BusinessHoursRow[];
    },
  });

  const catBySlug = useMemo(() => {
    const m = new Map<string, BusinessCategory>();
    for (const c of catsQ.data ?? []) m.set(c.slug, c);
    return m;
  }, [catsQ.data]);

  const filtered = useMemo(() => {
    const all = bizQ.data ?? [];
    const term = q.trim().toLowerCase();
    const catId = category !== "all" ? catBySlug.get(category)?.id ?? category : null;
    const minR = Number(minRating) || 0;
    const hoursMap = new Map<string, BusinessHoursRow[]>();
    for (const h of hoursQ.data ?? []) {
      if (!hoursMap.has(h.business_id)) hoursMap.set(h.business_id, []);
      hoursMap.get(h.business_id)!.push(h);
    }
    return all.filter((b) => {
      if (catId && b.category_id !== catId) return false;
      if (union !== "all" && b.union_name !== union) return false;
      if (upazila !== "all" && b.upazila !== upazila) return false;
      if (verified && !b.is_verified) return false;
      if (featured && !b.is_featured) return false;
      if (minR > 0 && Number(b.avg_rating) < minR) return false;
      if (openNow && !isOpenNow(hoursMap.get(b.id))) return false;
      if (term) {
        const hay = [b.name, b.short_description, b.area, b.union_name, b.products?.join(" ")].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [bizQ.data, hoursQ.data, q, category, union, upazila, verified, featured, openNow, minRating, catBySlug]);

  const catName = (id: string | null) => catsQ.data?.find((c) => c.id === id)?.name_bn ?? undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/business" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> স্থানীয় ব্যবসা হোম
      </Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">সব ব্যবসা</h1>
          <p className="mt-1 text-sm text-muted-foreground">ফিল্টার ও সার্চ ব্যবহার করে আপনার প্রয়োজন খুঁজুন</p>
        </div>
        <Button asChild><Link to="/business/register"><Plus className="mr-2 h-4 w-4" /> ব্যবসা যোগ করুন</Link></Button>
      </div>

      <Card className="mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, পণ্য বা এলাকা খুঁজুন" className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="ক্যাটাগরি" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
              {(catsQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.slug}>{c.icon} {c.name_bn}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={upazila} onValueChange={setUpazila}>
            <SelectTrigger><SelectValue placeholder="উপজেলা" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব উপজেলা</SelectItem>
              {UPAZILAS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={union} onValueChange={setUnion}>
            <SelectTrigger><SelectValue placeholder="ইউনিয়ন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ইউনিয়ন</SelectItem>
              {UNIONS_UKHIYA.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger><SelectValue placeholder="রেটিং" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">সব রেটিং</SelectItem>
              <SelectItem value="3">৩+ স্টার</SelectItem>
              <SelectItem value="4">৪+ স্টার</SelectItem>
              <SelectItem value="4.5">৪.৫+ স্টার</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Checkbox checked={verified} onCheckedChange={(v) => setVerified(Boolean(v))} /> শুধু যাচাইকৃত
          </label>
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Checkbox checked={featured} onCheckedChange={(v) => setFeatured(Boolean(v))} /> ফিচার্ড
          </label>
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Checkbox checked={openNow} onCheckedChange={(v) => setOpenNow(Boolean(v))} /> এখন খোলা
          </label>
        </div>
      </Card>

      {bizQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Filter className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">এই ফিল্টারে কোন ব্যবসা পাওয়া যায়নি।</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => <BusinessCard key={b.id} b={b} categoryName={catName(b.category_id)} />)}
        </div>
      )}
    </div>
  );
}

// unused imports guard removed
void Label;
