import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Filter, MapPin, Clock, Wallet, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { UPAZILAS } from "@/lib/teachers-shared";
import { STUDENT_CLASSES, TUITION_MODES, TUTOR_GENDERS, TUITION_STATUS_LABEL, type TuitionRequestPublic } from "@/lib/education-shared";
import { EducationSubNav } from "@/components/teachers/EducationSubNav";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/teachers/tuitions/")({
  head: () => ({
    meta: [
      { title: "টিউশনের সুযোগ — উখিয়ার শিক্ষক খুঁজুন" },
      { name: "description", content: "উখিয়া ও কক্সবাজারের অনুমোদিত টিউশনের সুযোগ। শ্রেণি, বিষয় ও এলাকা অনুযায়ী খুঁজুন।" },
      { property: "og:title", content: "টিউশনের সুযোগ" },
      { property: "og:description", content: "আপনার জন্য নতুন টিউশন খুঁজুন।" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TuitionsList,
});

function TuitionsList() {
  const [q, setQ] = useState("");
  const [upazila, setUpazila] = useState("all");
  const [cls, setCls] = useState("all");
  const [mode, setMode] = useState("all");

  const listQ = useQuery({
    queryKey: ["tuitions", "public"],
    queryFn: async (): Promise<TuitionRequestPublic[]> => {
      const { data, error } = await supabase.from("public_tuition_requests").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as TuitionRequestPublic[];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (listQ.data ?? []).filter((r) => {
      if (upazila !== "all" && r.upazila !== upazila) return false;
      if (cls !== "all" && r.student_class !== cls) return false;
      if (mode !== "all" && r.mode !== mode) return false;
      if (term && !`${r.subject} ${r.area ?? ""} ${r.student_class} ${r.notes ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [listQ.data, q, upazila, cls, mode]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <EducationSubNav />
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">📚 টিউশনের সুযোগ</h1>
          <p className="mt-1 text-sm text-muted-foreground">অনুমোদিত টিউশন রিকোয়েস্ট দেখুন। অভিভাবকের ফোন নম্বর গোপন রাখা হয়েছে।</p>
        </div>
        <Button asChild className="h-10">
          <Link to="/teachers/tuitions/new"><Plus className="mr-2 h-4 w-4" /> টিউশন খুঁজছি (অভিভাবক)</Link>
        </Button>
      </header>

      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-5">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="বিষয়, এলাকা…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={upazila} onValueChange={setUpazila}>
            <SelectTrigger><SelectValue placeholder="উপজেলা" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল উপজেলা</SelectItem>
              {UPAZILAS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল শ্রেণি</SelectItem>
              {STUDENT_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger><SelectValue placeholder="ধরন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ধরন</SelectItem>
              {TUITION_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {listQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <Filter className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          কোনো টিউশন পাওয়া যায়নি। শীঘ্রই নতুন সুযোগ যোগ হবে।
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const gender = TUTOR_GENDERS.find((g) => g.value === r.preferred_gender)?.label ?? "যেকোনো";
            const modeLabel = TUITION_MODES.find((m) => m.value === r.mode)?.label ?? r.mode;
            return (
              <Link key={r.id} to="/teachers/tuitions/$id" params={{ id: r.id }} className="group">
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-primary">{r.subject}</h3>
                      <Badge variant="outline">{TUITION_STATUS_LABEL[r.status] ?? r.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm">{r.student_class}</p>
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {[r.area, r.upazila].filter(Boolean).join(", ")}</div>
                      {r.budget != null && <div className="flex items-center gap-1.5"><Wallet className="h-3 w-3" /> ৳ {toBanglaDigits(r.budget)}</div>}
                      {r.preferred_time && <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {r.preferred_time}</div>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs">{modeLabel}</Badge>
                      <Badge variant="outline" className="text-xs">শিক্ষক: {gender}</Badge>
                      {r.days_per_week && <Badge variant="outline" className="text-xs">সপ্তাহে {toBanglaDigits(r.days_per_week)} দিন</Badge>}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
                      <span className="text-muted-foreground"><Users className="mr-1 inline h-3 w-3" /> অভিভাবকের ফোন গোপন</span>
                      <span className="font-medium text-primary group-hover:underline">বিস্তারিত →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
