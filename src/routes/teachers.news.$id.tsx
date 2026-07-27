import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { EducationSubNav } from "@/components/teachers/EducationSubNav";
import { formatBanglaDate } from "@/lib/bangla";
import type { EducationNewsRow } from "@/lib/education-shared";
import { EducationImage } from "@/components/teachers/EducationImage";
import { ShareButtons } from "@/components/teachers/ShareButtons";

export const Route = createFileRoute("/teachers/news/$id")({
  component: NewsDetail,
});

function NewsDetail() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["news", id],
    queryFn: async (): Promise<EducationNewsRow | null> => {
      const { data, error } = await supabase.from("education_news").select("*").eq("id", id).eq("is_published", true).maybeSingle();
      if (error) throw error;
      return data as EducationNewsRow | null;
    },
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl px-4 py-8"><Skeleton className="h-64 w-full" /></div>;
  if (!q.data) return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-bold">সংবাদটি পাওয়া যায়নি</h1>
      <Button asChild variant="outline" className="mt-4"><Link to="/teachers/news">সংবাদে ফিরে যান</Link></Button>
    </div>
  );
  const n = q.data;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <EducationSubNav />
      <Link to="/teachers/news" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> সংবাদ
      </Link>
      <article>
        {n.cover_image_url && <div className="mb-5 overflow-hidden rounded-lg"><EducationImage path={n.cover_image_url} alt={n.title} className="w-full" /></div>}
        {n.category && <Badge variant="secondary" className="mb-2">{n.category}</Badge>}
        <h1 className="text-2xl font-bold sm:text-3xl">{n.title}</h1>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {formatBanglaDate(n.publish_date)}</p>
        <Card className="mt-5"><CardContent className="prose prose-sm max-w-none whitespace-pre-wrap p-6 dark:prose-invert">{n.content}</CardContent></Card>
      </article>
    </div>
  );
}
