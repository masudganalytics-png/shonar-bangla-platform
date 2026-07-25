import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title: "নোটিশ বোর্ড — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "উখিয়া বিদ্যুৎ কর্তৃপক্ষের সর্বশেষ ঘোষণা ও নোটিশ।" },
      { property: "og:title", content: "নোটিশ বোর্ড" },
      { property: "og:description", content: "সর্বশেষ বিদ্যুৎ সংক্রান্ত সরকারি ঘোষণা।" },
    ],
  }),
  component: NoticesPage,
});

const PRIORITY_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  urgent: { label: "জরুরি", variant: "destructive" },
  high: { label: "গুরুত্বপূর্ণ", variant: "default" },
  normal: { label: "সাধারণ", variant: "secondary" },
  low: { label: "কম গুরুত্বপূর্ণ", variant: "outline" },
};

function NoticesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, priority, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">নোটিশ বোর্ড</h1>
          <p className="text-sm text-muted-foreground">কর্তৃপক্ষের সর্বশেষ ঘোষণা</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
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
          const p = PRIORITY_LABEL[n.priority] ?? PRIORITY_LABEL.normal;
          return (
            <Card key={n.id} className="p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-base font-semibold sm:text-lg">{n.title}</h2>
                <Badge variant={p.variant}>{p.label}</Badge>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
              <p className="mt-3 text-xs text-muted-foreground/80">{formatBanglaDate(n.published_at)}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
