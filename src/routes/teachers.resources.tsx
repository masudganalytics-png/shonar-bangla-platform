import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Search, Youtube, HardDrive, FileText, Globe, Link as LinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { EducationSubNav } from "@/components/teachers/EducationSubNav";
import type { ResourceRow } from "@/lib/education-shared";

export const Route = createFileRoute("/teachers/resources")({
  head: () => ({ meta: [
    { title: "শিক্ষা রিসোর্স — উখিয়ার শিক্ষক খুঁজুন" },
    { name: "description", content: "শিক্ষার্থীদের জন্য বিনামূল্যে গাইড, ভিডিও, PDF ও ওয়েবসাইট।" },
    { property: "og:title", content: "শিক্ষা রিসোর্স" },
    { property: "og:description", content: "সব ক্লাসের বিনামূল্যের রিসোর্স।" },
    { property: "og:type", content: "website" },
  ] }),
  component: ResourcesPage,
});

const TYPE_ICON = { website: Globe, youtube: Youtube, gdrive: HardDrive, pdf: FileText, link: LinkIcon } as const;

function ResourcesPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const listQ = useQuery({
    queryKey: ["resources", "public"],
    queryFn: async (): Promise<ResourceRow[]> => {
      const { data, error } = await supabase.from("study_resources").select("*").eq("is_published", true).order("sort_order").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as ResourceRow[];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (listQ.data ?? []).filter((r) => {
      if (type !== "all" && r.resource_type !== type) return false;
      if (term && !`${r.title} ${r.description ?? ""} ${r.subject ?? ""} ${r.student_class ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [listQ.data, q, type]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <EducationSubNav />
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">📚 শিক্ষা রিসোর্স</h1>
        <p className="mt-1 text-sm text-muted-foreground">বিনামূল্যে গাইড, ভিডিও, PDF ও ওয়েবসাইট। নতুন ট্যাবে খুলবে।</p>
      </header>
      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
          <div className="relative sm:col-span-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="বিষয়, শ্রেণি, শিরোনাম…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="ধরন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ধরন</SelectItem>
              <SelectItem value="website">ওয়েবসাইট</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="gdrive">Google Drive</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="link">লিংক</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {listQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" /> এখনো কোনো রিসোর্স যোগ হয়নি।
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const Icon = TYPE_ICON[r.resource_type] ?? LinkIcon;
            return (
              <Card key={r.id} className="flex h-full flex-col overflow-hidden">
                {r.thumbnail_url ? (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img src={r.thumbnail_url} alt={r.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted"><Icon className="h-10 w-10 text-muted-foreground/40" /></div>
                )}
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <h3 className="font-semibold">{r.title}</h3>
                  </div>
                  {r.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.student_class && <Badge variant="outline" className="text-xs">{r.student_class}</Badge>}
                    {r.subject && <Badge variant="outline" className="text-xs">{r.subject}</Badge>}
                    {r.category && <Badge variant="secondary" className="text-xs">{r.category}</Badge>}
                  </div>
                  <Button asChild className="mt-auto pt-3" variant="outline">
                    <a href={r.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> রিসোর্স খুলুন
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
