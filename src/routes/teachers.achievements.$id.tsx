import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy, MapPin, School } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { EducationSubNav } from "@/components/teachers/EducationSubNav";
import type { AchievementRow } from "@/lib/education-shared";

export const Route = createFileRoute("/teachers/achievements/$id")({
  component: AchievementDetail,
});

function AchievementDetail() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["achievement", id],
    queryFn: async (): Promise<AchievementRow | null> => {
      const { data, error } = await supabase.from("student_achievements").select("*").eq("id", id).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as AchievementRow | null;
    },
  });
  if (q.isLoading) return <div className="mx-auto max-w-3xl px-4 py-8"><Skeleton className="h-64 w-full" /></div>;
  if (!q.data) return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-bold">সাফল্যটি পাওয়া যায়নি</h1>
      <Button asChild variant="outline" className="mt-4"><Link to="/teachers/achievements">সাফল্যে ফিরে যান</Link></Button>
    </div>
  );
  const a = q.data;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <EducationSubNav />
      <Link to="/teachers/achievements" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> সাফল্য
      </Link>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {a.photo_url ? (
              <img src={a.photo_url} alt={a.student_name} className="h-48 w-48 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-lg bg-muted"><Trophy className="h-16 w-16 text-muted-foreground/40" /></div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold">{a.student_name}</h1>
              <p className="mt-2 text-lg text-primary">🏆 {a.achievement}</p>
              {a.institution && <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><School className="h-4 w-4" /> {a.institution}</p>}
              {a.area && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {a.area}</p>}
            </div>
          </div>
          {a.story && (
            <div className="mt-6 border-t pt-6">
              <h2 className="mb-3 font-semibold">সাফল্যের গল্প</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{a.story}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
