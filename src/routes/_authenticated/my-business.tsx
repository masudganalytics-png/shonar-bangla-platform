import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Eye, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BusinessLogo } from "@/components/business/BusinessLogo";
import { toBanglaDigits } from "@/lib/bangla";
import type { BusinessRow } from "@/lib/business-shared";

export const Route = createFileRoute("/_authenticated/my-business")({
  head: () => ({ meta: [{ title: "আমার ব্যবসা — খিজিরিয়ন" }, { name: "robots", content: "noindex" }] }),
  component: MyBusiness,
});

function MyBusiness() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-businesses", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("*")
        .eq("owner_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as BusinessRow[];
    },
  });

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge className="bg-emerald-500 text-white">অনুমোদিত</Badge>;
    if (s === "pending") return <Badge className="bg-amber-500 text-white">অপেক্ষমাণ</Badge>;
    if (s === "rejected") return <Badge variant="destructive">প্রত্যাখ্যাত</Badge>;
    return <Badge variant="outline">স্থগিত</Badge>;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">আমার ব্যবসা</h1>
          <p className="mt-1 text-sm text-muted-foreground">আপনার নিবন্ধিত ব্যবসাগুলোর তালিকা ও স্ট্যাটাস</p>
        </div>
        <Button asChild><Link to="/business/register"><Plus className="mr-2 h-4 w-4" /> নতুন ব্যবসা</Link></Button>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card className="p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">এখনো কোন ব্যবসা নিবন্ধিত নেই।</p>
          <Button asChild className="mt-4"><Link to="/business/register">ব্যবসা যোগ করুন</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {(q.data ?? []).map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <BusinessLogo path={b.logo_url} name={b.name} className="h-14 w-14 text-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">{b.name}</h3>
                    {statusBadge(b.status)}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <Eye className="mr-1 inline h-3 w-3" /> {toBanglaDigits(b.view_count)} ভিউ · ⭐ {toBanglaDigits(Number(b.avg_rating).toFixed(1))} ({toBanglaDigits(b.review_count)})
                  </p>
                </div>
                {b.status === "approved" && (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/business/$slug" params={{ slug: b.slug || b.id }}>দেখুন</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
