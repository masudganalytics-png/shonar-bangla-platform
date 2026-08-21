import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, BadgeCheck, UserPlus, Phone, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CONTACT_LOGIN_HINT, TEACHER_PUBLIC_COLUMNS, columnsFor } from "@/lib/public-columns";
import { UPAZILAS, type TeacherRow, type CategoryRow } from "@/lib/teachers-shared";
import { TeacherPhoto } from "@/components/teachers/TeacherPhoto";
import { EducationSubNav } from "@/components/teachers/EducationSubNav";

export const Route = createFileRoute("/teachers/")({
  head: () => ({
    meta: [
      { title: "উখিয়ার শিক্ষক খুঁজুন — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "উখিয়ার যাচাইকৃত শিক্ষক, টিউটর ও প্রশিক্ষকদের ফ্রি ডিরেক্টরি। বিষয়, উপজেলা ও এলাকা অনুযায়ী খুঁজুন।" },
      { property: "og:title", content: "উখিয়ার শিক্ষক খুঁজুন" },
      { property: "og:description", content: "উখিয়ার যাচাইকৃত শিক্ষক ও টিউটরদের তালিকা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeachersDirectory,
});

function TeachersDirectory() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [upazila, setUpazila] = useState<string>("all");
  const { isAuthenticated, loading: authLoading } = useAuth();

  const catsQ = useQuery({
    queryKey: ["teacher-categories"],
    queryFn: async (): Promise<CategoryRow[]> => {
      const { data, error } = await supabase.from("teacher_categories").select("*").order("sort_order").order("name_bn");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  const teachersQ = useQuery({
    queryKey: ["teachers", "public", isAuthenticated],
    enabled: !authLoading,
    queryFn: async (): Promise<TeacherRow[]> => {
      const { data, error } = await supabase
        .from("teachers")
        .select(columnsFor(TEACHER_PUBLIC_COLUMNS, isAuthenticated))
        .eq("status", "approved")
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as unknown as TeacherRow[];
    },
  });

  const filtered = useMemo(() => {
    const all = teachersQ.data ?? [];
    const term = q.trim().toLowerCase();
    return all.filter((t) => {
      if (categoryId !== "all" && t.category_id !== categoryId) return false;
      if (upazila !== "all" && t.upazila !== upazila) return false;
      if (term) {
        const hay = [t.full_name, t.subjects, t.qualification, t.area, t.description].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [teachersQ.data, q, categoryId, upazila]);

  const catName = (id: string | null) => catsQ.data?.find((c) => c.id === id)?.name_bn ?? "—";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <EducationSubNav />
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">🎓 উখিয়ার শিক্ষক খুঁজুন</h1>
          <p className="mt-1 text-sm text-muted-foreground">আপনার এলাকার যাচাইকৃত শিক্ষক ও টিউটর সহজে খুঁজুন।</p>
        </div>
        <Button asChild size="sm" className="h-10">
          <Link to="/teachers/register"><UserPlus className="mr-2 h-4 w-4" /> শিক্ষক হিসেবে নিবন্ধন করুন</Link>
        </Button>
      </header>

      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="নাম, বিষয়, যোগ্যতা, এলাকা…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="সকল বিষয়" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল বিষয়</SelectItem>
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

      {teachersQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          কোনো শিক্ষক পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন অথবা নতুন নিবন্ধনের জন্য অপেক্ষা করুন।
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Link key={t.id} to="/teachers/$id" params={{ id: (t as any).slug || t.id }} className="group">
              <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
                <div className="flex gap-3 p-4">
                  <TeacherPhoto path={t.photo_url} alt={t.full_name} className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-semibold">{t.full_name}</h3>
                      {t.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                    </div>
                    <p className="mt-0.5 text-sm text-primary">{catName(t.category_id)}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {[t.area, t.upazila].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {t.is_available ? (
                        <Badge className="bg-secondary text-secondary-foreground">উপলব্ধ</Badge>
                      ) : (
                        <Badge variant="outline">ব্যস্ত</Badge>
                      )}
                      {typeof t.experience_years === "number" && t.experience_years > 0 && (
                        <Badge variant="outline">{t.experience_years}+ বছর</Badge>
                      )}
                      {t.qualification && (
                        <Badge variant="outline" className="line-clamp-1 max-w-[12rem]">{t.qualification}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {t.phone || CONTACT_LOGIN_HINT}</span>
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
