import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { EducationSubNav } from "@/components/teachers/EducationSubNav";
import { formatBanglaDate } from "@/lib/bangla";
import type { EducationNewsRow } from "@/lib/education-shared";
import { EducationImage } from "@/components/teachers/EducationImage";

export const Route = createFileRoute("/teachers/news/")({
  head: () => ({ meta: [
    { title: "শিক্ষা সংবাদ — উখিয়ার শিক্ষক খুঁজুন" },
    { name: "description", content: "শিক্ষা সংক্রান্ত সাম্প্রতিক সংবাদ, বিজ্ঞপ্তি ও ঘোষণা।" },
    { property: "og:title", content: "শিক্ষা সংবাদ" },
    { property: "og:description", content: "সাম্প্রতিক শিক্ষা সংবাদ।" },
    { property: "og:type", content: "website" },
  ] }),
  component: NewsList,
});

function NewsList() {
  const q = useQuery({
    queryKey: ["news", "public"],
    queryFn: async (): Promise<EducationNewsRow[]> => {
      const { data, error } = await supabase.from("education_news").select("*").eq("is_published", true).order("publish_date", { ascending: false }).limit(200);
      if (error) throw error;
      return data as EducationNewsRow[];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <EducationSubNav />
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">📰 শিক্ষা সংবাদ</h1>
        <p className="mt-1 text-sm text-muted-foreground">সাম্প্রতিক শিক্ষা সংক্রান্ত সংবাদ ও ঘোষণা।</p>
      </header>
      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <Newspaper className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" /> এখনো কোনো সংবাদ যোগ হয়নি।
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((n) => (
            <Link key={n.id} to="/teachers/news/$id" params={{ id: n.id }} className="group">
              <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
                {n.cover_image_url ? (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <EducationImage path={n.cover_image_url} alt={n.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted"><Newspaper className="h-10 w-10 text-muted-foreground/40" /></div>
                )}
                <CardContent className="p-4">
                  {n.category && <Badge variant="secondary" className="mb-2 text-xs">{n.category}</Badge>}
                  <h3 className="font-semibold group-hover:text-primary">{n.title}</h3>
                  {n.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>}
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {formatBanglaDate(n.publish_date)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
