import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Flag, Power } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminListCommunities,
  adminListCommunityReports,
  adminSetCommunityActive,
  adminSetCommunityContentHidden,
} from "@/lib/community.functions";
import { KIND_LABEL_BN } from "@/lib/community-shared";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/community")({
  head: () => ({
    meta: [
      { title: "কমিউনিটি ব্যবস্থাপনা — অ্যাডমিন" },
      { name: "description", content: "রিপোর্ট করা পোস্ট ও অনুষ্ঠান এবং কমিউনিটি ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCommunity,
});

function AdminCommunity() {
  const qc = useQueryClient();

  const reportsQ = useQuery({
    queryKey: ["admin", "community-reports"],
    queryFn: () => adminListCommunityReports(),
  });

  const communitiesQ = useQuery({
    queryKey: ["admin", "communities"],
    queryFn: () => adminListCommunities(),
  });

  const hideM = useMutation({
    mutationFn: (v: { targetType: "post" | "event"; targetId: string; isHidden: boolean }) =>
      adminSetCommunityContentHidden({ data: v }),
    onSuccess: async () => {
      toast.success("আপডেট হয়েছে");
      await qc.invalidateQueries({ queryKey: ["admin", "community-reports"] });
    },
    onError: (e: Error) => toast.error(e.message || "আপডেট করা যায়নি"),
  });

  const activeM = useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => adminSetCommunityActive({ data: v }),
    onSuccess: async () => {
      toast.success("আপডেট হয়েছে");
      await qc.invalidateQueries({ queryKey: ["admin", "communities"] });
    },
    onError: (e: Error) => toast.error(e.message || "আপডেট করা যায়নি"),
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">🤝 কমিউনিটি ব্যবস্থাপনা</h2>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">রিপোর্ট</TabsTrigger>
          <TabsTrigger value="communities">কমিউনিটি তালিকা</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {reportsQ.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : reportsQ.isError ? (
            <Card className="p-6 text-sm text-destructive">লোড করা যায়নি: {String((reportsQ.error as Error).message)}</Card>
          ) : (reportsQ.data ?? []).length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">কোনো রিপোর্ট নেই।</Card>
          ) : (
            (reportsQ.data ?? []).map((r) => (
              <Card key={`${r.target_type}:${r.target_id}`} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {r.target_type === "post" ? "পোস্ট" : "অনুষ্ঠান"}
                  </Badge>
                  <Badge variant="destructive" className="text-[10px]">
                    <Flag className="mr-1 h-3 w-3" /> {toBanglaDigits(r.report_count)} রিপোর্ট
                  </Badge>
                  {r.is_hidden ? <Badge variant="outline" className="text-[10px]">লুকানো</Badge> : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.preview || "—"}</p>
                {r.reasons.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">কারণ: {r.reasons.slice(0, 5).join(", ")}</p>
                ) : null}
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={r.is_hidden ? "outline" : "destructive"}
                    disabled={hideM.isPending}
                    onClick={() =>
                      hideM.mutate({ targetType: r.target_type, targetId: r.target_id, isHidden: !r.is_hidden })
                    }
                  >
                    {r.is_hidden ? (
                      <>
                        <Eye className="mr-1.5 h-4 w-4" /> আবার দেখান
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1.5 h-4 w-4" /> লুকান
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="communities" className="mt-4 space-y-3">
          {communitiesQ.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (communitiesQ.data ?? []).length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">কোনো কমিউনিটি নেই।</Card>
          ) : (
            (communitiesQ.data ?? []).map((c) => (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/community/c/$slug"
                      params={{ slug: c.slug ?? c.id }}
                      className="truncate font-semibold hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    <Badge variant="secondary" className="text-[10px]">{KIND_LABEL_BN[c.kind]}</Badge>
                    {!c.is_active ? <Badge variant="outline" className="text-[10px]">নিষ্ক্রিয়</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.area ? `${c.area} • ` : ""}
                    {toBanglaDigits(c.member_count)} সদস্য
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={c.is_active ? "destructive" : "outline"}
                  disabled={activeM.isPending}
                  onClick={() => activeM.mutate({ id: c.id, isActive: !c.is_active })}
                >
                  <Power className="mr-1.5 h-4 w-4" /> {c.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                </Button>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
