import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Trash2, Loader2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listAllReviews, moderateReview, deleteReviewAdmin } from "@/lib/business.functions";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/business-reviews")({
  head: () => ({ meta: [{ title: "পর্যালোচনা মডারেশন — অ্যাডমিন" }, { name: "robots", content: "noindex" }] }),
  component: AdminBusinessReviews,
});

function AdminBusinessReviews() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-biz-reviews"], queryFn: () => listAllReviews() });

  const mod = useMutation({
    mutationFn: (v: { id: string; is_hidden: boolean }) => moderateReview({ data: v }),
    onSuccess: () => { toast.success("সংরক্ষিত"); qc.invalidateQueries({ queryKey: ["admin-biz-reviews"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteReviewAdmin({ data: { id } }),
    onSuccess: () => { toast.success("ডিলিট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin-biz-reviews"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">পর্যালোচনা মডারেশন</h2>
      {q.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">কোন পর্যালোচনা নেই।</Card>
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.business_name}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 stroke-amber-400" : "stroke-muted-foreground/40"}`} />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("bn-BD")} · রেটিং {toBanglaDigits(r.rating)}
                    </span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                  {r.is_hidden && <p className="mt-1 text-xs text-destructive">লুকানো</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => mod.mutate({ id: r.id, is_hidden: !r.is_hidden })}>
                    {r.is_hidden ? <><Eye className="mr-1 h-4 w-4" /> দেখান</> : <><EyeOff className="mr-1 h-4 w-4" /> লুকান</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("ডিলিট করবেন?")) del.mutate(r.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
