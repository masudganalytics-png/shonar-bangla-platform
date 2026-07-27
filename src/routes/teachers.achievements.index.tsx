import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { EducationSubNav } from "@/components/teachers/EducationSubNav";
import type { AchievementRow } from "@/lib/education-shared";

export const Route = createFileRoute("/teachers/achievements/")({
  head: () => ({ meta: [
    { title: "শিক্ষার্থীদের সাফল্য — উখিয়ার শিক্ষক খুঁজুন" },
    { name: "description", content: "উখিয়া ও কক্সবাজারের শিক্ষার্থীদের অনন্য অর্জন ও সাফল্যের গল্প।" },
    { property: "og:title", content: "শিক্ষার্থীদের সাফল্য" },
    { property: "og:description", content: "স্থানীয় শিক্ষার্থীদের অর্জন।" },
    { property: "og:type", content: "website" },
  ] }),
  component: AchievementsList,
});

function AchievementsList() {
  const q = useQuery({
    queryKey: ["achievements", "public"],
    queryFn: async (): Promise<AchievementRow[]> => {
      const { data, error } = await supabase.from("student_achievements").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as AchievementRow[];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <EducationSubNav />
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">🏆 শিক্ষার্থীদের সাফল্য</h1>
        <p className="mt-1 text-sm text-muted-foreground">আমাদের এলাকার শিক্ষার্থীদের অনন্য অর্জন ও অনুপ্রেরণামূলক গল্প।</p>
      </header>
      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" /> এখনো কোনো সাফল্য প্রকাশ হয়নি।
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((a) => (
            <Link key={a.id} to="/teachers/achievements/$id" params={{ id: a.id }} className="group">
              <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
                {a.photo_url ? (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={a.photo_url} alt={a.student_name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted"><Trophy className="h-12 w-12 text-muted-foreground/40" /></div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold group-hover:text-primary">{a.student_name}</h3>
                  <p className="mt-1 text-sm text-primary">{a.achievement}</p>
                  {a.institution && <p className="mt-1 text-xs text-muted-foreground">{a.institution}</p>}
                  {a.area && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {a.area}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
