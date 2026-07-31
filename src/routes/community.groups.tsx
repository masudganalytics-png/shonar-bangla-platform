import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { CommunityCard } from "@/components/community/CommunityCard";
import type { CommunityRow } from "@/lib/community-shared";

export const Route = createFileRoute("/community/groups")({
  head: () => ({
    meta: [
      { title: "গ্রুপ — কমিউনিটি | উখিয়া সেবা" },
      { name: "description", content: "স্কুল ব্যাচ, কলেজ ব্যাচ, বন্ধুদের গ্রুপ, স্পোর্টস টিম ও এলাকাভিত্তিক গ্রুপ খুঁজুন।" },
      { property: "og:title", content: "গ্রুপ — উখিয়া সেবা" },
      { property: "og:description", content: "ব্যাচ, বন্ধু ও এলাকার গ্রুপে যোগ দিন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const q = useQuery({
    queryKey: ["community-list", "group"],
    queryFn: async (): Promise<CommunityRow[]> => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .in("kind", ["group", "community"])
        .eq("is_active", true)
        .order("member_count", { ascending: false });
      if (error) throw error;
      return data as CommunityRow[];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">👥 গ্রুপ</h1>
          <p className="mt-1 text-sm text-muted-foreground">ব্যাচ, বন্ধু ও এলাকার গ্রুপ</p>
        </div>
        <Button asChild>
          <Link to="/community/new"><Plus className="mr-2 h-4 w-4" /> গ্রুপ তৈরি করুন</Link>
        </Button>
      </div>

      {q.isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <Card className="mt-6 p-8 text-center text-sm text-muted-foreground">এখনো কোনো গ্রুপ নেই।</Card>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((c) => <CommunityCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}
