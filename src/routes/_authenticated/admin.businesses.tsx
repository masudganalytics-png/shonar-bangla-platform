import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Sparkles, Trash2, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  listAllBusinesses, setBusinessStatus, setBusinessVerified, setBusinessFeatured, deleteBusinessAdmin,
  type AdminBusiness,
} from "@/lib/business.functions";
import { toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/businesses")({
  head: () => ({ meta: [{ title: "ব্যবসা ব্যবস্থাপনা — অ্যাডমিন" }, { name: "robots", content: "noindex" }] }),
  component: AdminBusinesses,
});

function AdminBusinesses() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "suspended">("pending");
  const [q, setQ] = useState("");

  const listQ = useQuery({ queryKey: ["admin-businesses"], queryFn: () => listAllBusinesses() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-businesses"] });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: AdminBusiness["status"] }) => setBusinessStatus({ data: v }),
    onSuccess: () => { toast.success("স্ট্যাটাস আপডেট হয়েছে"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const setVer = useMutation({
    mutationFn: (v: { id: string; is_verified: boolean }) => setBusinessVerified({ data: v }),
    onSuccess: () => { toast.success("সংরক্ষিত"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const setFeat = useMutation({
    mutationFn: (v: { id: string; is_featured: boolean }) => setBusinessFeatured({ data: v }),
    onSuccess: () => { toast.success("সংরক্ষিত"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteBusinessAdmin({ data: { id } }),
    onSuccess: () => { toast.success("ডিলিট হয়েছে"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const rows = (listQ.data ?? []).filter((r) => r.status === tab).filter((r) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return [r.name, r.phone, r.category_name, r.area, r.union_name].filter(Boolean).some((x) => String(x).toLowerCase().includes(t));
  });

  const counts = (listQ.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
  }, {});

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">ব্যবসা ব্যবস্থাপনা</h2>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম / ফোন / এলাকা" className="pl-9" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">অপেক্ষমাণ ({toBanglaDigits(counts.pending ?? 0)})</TabsTrigger>
          <TabsTrigger value="approved">অনুমোদিত ({toBanglaDigits(counts.approved ?? 0)})</TabsTrigger>
          <TabsTrigger value="rejected">প্রত্যাখ্যাত ({toBanglaDigits(counts.rejected ?? 0)})</TabsTrigger>
          <TabsTrigger value="suspended">স্থগিত ({toBanglaDigits(counts.suspended ?? 0)})</TabsTrigger>
        </TabsList>
      </Tabs>

      {listQ.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-sm text-muted-foreground">কোন ব্যবসা নেই।</Card>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr,auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.name}</h3>
                    {r.is_verified && <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10"><BadgeCheck className="h-3 w-3" /> যাচাই</Badge>}
                    {r.is_featured && <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400"><Sparkles className="h-3 w-3" /> ফিচার্ড</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.category_name ?? "—"} · {r.phone} · {[r.area, r.union_name, r.upazila].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ⭐ {toBanglaDigits(r.avg_rating.toFixed(1))} ({toBanglaDigits(r.review_count)}) · 👁 {toBanglaDigits(r.view_count)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={r.status} onValueChange={(v) => setStatus.mutate({ id: r.id, status: v as AdminBusiness["status"] })}>
                    <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
                      <SelectItem value="approved">অনুমোদন</SelectItem>
                      <SelectItem value="rejected">প্রত্যাখ্যান</SelectItem>
                      <SelectItem value="suspended">স্থগিত</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant={r.is_verified ? "default" : "outline"} onClick={() => setVer.mutate({ id: r.id, is_verified: !r.is_verified })}>
                    {r.is_verified ? "যাচাই বাতিল" : "যাচাই"}
                  </Button>
                  <Button size="sm" variant={r.is_featured ? "default" : "outline"} onClick={() => setFeat.mutate({ id: r.id, is_featured: !r.is_featured })}>
                    {r.is_featured ? "ফিচার্ড বাতিল" : "ফিচার্ড"}
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
