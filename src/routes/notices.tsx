import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Loader2, AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBanglaDate } from "@/lib/bangla";
import { ANNOUNCEMENT_CATEGORIES, categoryMeta, priorityLabel } from "@/lib/announcement-constants";

type CategoryFilter = "all" | typeof ANNOUNCEMENT_CATEGORIES[number]["value"];

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title: "নোটিশ বোর্ড — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "উখিয়া বিদ্যুৎ কর্তৃপক্ষের সর্বশেষ ঘোষণা, বিদ্যুৎ বিভ্রাট ও ট্যারিফ পরিবর্তনের নোটিশ।" },
      { property: "og:title", content: "নোটিশ বোর্ড — উখিয়া বিদ্যুৎ বিল" },
      { property: "og:description", content: "সর্বশেষ সরকারি ঘোষণা, বিভ্রাট ও ট্যারিফ পরিবর্তন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NoticesPage,
});

function NoticesPage() {
  const [cat, setCat] = useState<CategoryFilter>("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements", cat],
    queryFn: async () => {
      let q = supabase
        .from("announcements")
        .select("id, title, body, category, priority, location, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(50);
      if (cat !== "all") q = q.eq("category", cat);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">নোটিশ বোর্ড</h1>
          <p className="text-sm text-muted-foreground">সরকারি ঘোষণা, বিদ্যুৎ বিভ্রাট ও ট্যারিফ পরিবর্তন</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" variant={cat === "all" ? "default" : "outline"} onClick={() => setCat("all")}>সব</Button>
        {ANNOUNCEMENT_CATEGORIES.map((c) => (
          <Button key={c.value} size="sm" variant={cat === c.value ? "default" : "outline"} onClick={() => setCat(c.value)}>
            {c.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      )}

      {error && (
        <Card className="flex items-center gap-3 border-destructive/40 bg-destructive/5 p-6 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">নোটিশ লোড করা যায়নি।</p>
        </Card>
      )}

      {data && data.length === 0 && (
        <Card className="p-10 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">এখনও কোনো নোটিশ প্রকাশিত হয়নি।</p>
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((n) => {
          const c = categoryMeta(n.category);
          return (
            <Card key={n.id} className="p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={c.tone}>{c.label}</Badge>
                <Badge variant="secondary">{priorityLabel(n.priority)}</Badge>
                <span className="text-xs text-muted-foreground">{formatBanglaDate(n.published_at)}</span>
              </div>
              <h2 className="mt-2 text-base font-semibold sm:text-lg">{n.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
              {n.location && (
                <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground/80">
                  <MapPin className="h-3 w-3" /> {n.location}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
