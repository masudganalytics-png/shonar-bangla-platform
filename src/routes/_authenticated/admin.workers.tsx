import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, Trash2, BadgeCheck, Loader2, Plus, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryRow } from "@/lib/workers-shared";
import { listAllWorkers, setWorkerStatus, setWorkerVerified, deleteWorker, upsertWorkerCategory, deleteWorkerCategory, adminCreateWorker, type AdminWorker } from "@/lib/workers.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/workers")({
  component: AdminWorkers,
});

function AdminWorkers() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "inactive" | "categories">("pending");
  const [search, setSearch] = useState("");

  const statusFn = useServerFn(setWorkerStatus);
  const verifyFn = useServerFn(setWorkerVerified);
  const delFn = useServerFn(deleteWorker);
  const upsertCatFn = useServerFn(upsertWorkerCategory);
  const delCatFn = useServerFn(deleteWorkerCategory);
  const createFn = useServerFn(adminCreateWorker);

  const wq = useQuery({
    queryKey: ["admin", "workers"],
    queryFn: () => listAllWorkers(),
    staleTime: 15_000,
  });

  const cq = useQuery({
    queryKey: ["worker-categories", "admin"],
    queryFn: async (): Promise<CategoryRow[]> => {
      const { data, error } = await supabase.from("worker_categories").select("*").order("sort_order").order("name_bn");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "workers"] });

  const mStatus = useMutation({ mutationFn: (v: { id: string; status: AdminWorker["status"] }) => statusFn({ data: v }), onSuccess: () => { toast.success("স্ট্যাটাস আপডেট"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const mVerify = useMutation({ mutationFn: (v: { id: string; is_verified: boolean }) => verifyFn({ data: v }), onSuccess: () => { toast.success("যাচাই আপডেট"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const mDelete = useMutation({ mutationFn: (v: { id: string }) => delFn({ data: v }), onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  const mCat = useMutation({
    mutationFn: (v: { id?: string; name_bn: string; slug: string; sort_order: number; is_active: boolean }) => upsertCatFn({ data: v }),
    onSuccess: () => { toast.success("ক্যাটাগরি সংরক্ষণ হয়েছে"); qc.invalidateQueries({ queryKey: ["worker-categories"] }); qc.invalidateQueries({ queryKey: ["worker-categories", "admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelCat = useMutation({
    mutationFn: (v: { id: string }) => delCatFn({ data: v }),
    onSuccess: () => { toast.success("ক্যাটাগরি মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["worker-categories"] }); qc.invalidateQueries({ queryKey: ["worker-categories", "admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [newCat, setNewCat] = useState({ name_bn: "", slug: "", sort_order: "50" });

  const tabs: Array<{ k: typeof tab; label: string }> = [
    { k: "pending", label: "অপেক্ষমাণ" },
    { k: "approved", label: "অনুমোদিত" },
    { k: "rejected", label: "প্রত্যাখ্যাত" },
    { k: "inactive", label: "নিষ্ক্রিয়" },
    { k: "categories", label: "ক্যাটাগরি" },
  ];

  const filtered = (wq.data ?? []).filter((w) => {
    if (tab === "categories") return false;
    if (w.status !== tab) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return [w.full_name, w.phone, w.area, w.category_name].some((f) => (f ?? "").toLowerCase().includes(s));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <AddWorkerDialog
          categories={cq.data ?? []}
          onCreate={async (v) => { await createFn({ data: v }); toast.success("কাজের লোক যোগ হয়েছে"); invalidate(); }}
        />
      </div>

      {tab === "categories" ? (
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">নতুন ক্যাটাগরি যোগ করুন</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <Input placeholder="বাংলা নাম" value={newCat.name_bn} onChange={(e) => setNewCat({ ...newCat, name_bn: e.target.value })} />
              <Input placeholder="slug (english-kebab)" value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} />
              <Input type="number" placeholder="ক্রম" value={newCat.sort_order} onChange={(e) => setNewCat({ ...newCat, sort_order: e.target.value })} />
              <Button onClick={() => {
                if (!newCat.name_bn.trim() || !newCat.slug.trim()) return toast.error("নাম ও slug আবশ্যক");
                mCat.mutate({ name_bn: newCat.name_bn.trim(), slug: newCat.slug.trim(), sort_order: Number(newCat.sort_order) || 50, is_active: true });
                setNewCat({ name_bn: "", slug: "", sort_order: "50" });
              }} disabled={mCat.isPending}>
                <Plus className="mr-1 h-4 w-4" /> যোগ করুন
              </Button>
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">নাম</th>
                  <th className="p-3 text-left">Slug</th>
                  <th className="p-3 text-left">ক্রম</th>
                  <th className="p-3 text-left">সক্রিয়</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {(cq.data ?? []).map((c) => <CategoryRowEditor key={c.id} cat={c} onSave={(v) => mCat.mutate(v)} onDelete={(id) => mDelCat.mutate({ id })} pending={mCat.isPending || mDelCat.isPending} />)}
                {(cq.data ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">কোনো ক্যাটাগরি নেই।</td></tr>}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <>
          <Input placeholder="নাম / ফোন / এলাকা / ক্যাটাগরি…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

          {wq.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <Card className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">নাম</th>
                    <th className="p-3 text-left">ক্যাটাগরি</th>
                    <th className="p-3 text-left">যোগাযোগ</th>
                    <th className="p-3 text-left">এলাকা</th>
                    <th className="p-3 text-left">জমা</th>
                    <th className="p-3 text-left">অবস্থা</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.id} className="border-b last:border-0 align-top">
                      <td className="p-3">
                        <div className="flex items-center gap-1 font-medium">
                          {w.full_name}
                          {w.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                        </div>
                        {w.experience_years ? <div className="text-xs text-muted-foreground">{w.experience_years}+ বছর</div> : null}
                      </td>
                      <td className="p-3 text-muted-foreground">{w.category_name ?? "—"}</td>
                      <td className="p-3">
                        <div>{w.phone}</div>
                        {w.whatsapp && <div className="text-xs text-muted-foreground">WA: {w.whatsapp}</div>}
                      </td>
                      <td className="p-3 text-muted-foreground">{[w.area, w.upazila].filter(Boolean).join(", ") || "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{formatBanglaDate(w.created_at)}</td>
                      <td className="p-3">
                        {w.status === "approved" && <Badge className="bg-secondary text-secondary-foreground">অনুমোদিত</Badge>}
                        {w.status === "pending" && <Badge variant="outline">অপেক্ষমাণ</Badge>}
                        {w.status === "rejected" && <Badge variant="destructive">প্রত্যাখ্যাত</Badge>}
                        {w.status === "inactive" && <Badge variant="outline">নিষ্ক্রিয়</Badge>}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-end gap-1">
                          {w.status !== "approved" && (
                            <Button size="sm" onClick={() => mStatus.mutate({ id: w.id, status: "approved" })} disabled={mStatus.isPending}>
                              <CheckCircle2 className="mr-1 h-3 w-3" /> অনুমোদন
                            </Button>
                          )}
                          {w.status !== "rejected" && (
                            <Button size="sm" variant="outline" onClick={() => mStatus.mutate({ id: w.id, status: "rejected" })} disabled={mStatus.isPending}>
                              <XCircle className="mr-1 h-3 w-3" /> প্রত্যাখ্যান
                            </Button>
                          )}
                          {w.status === "approved" && (
                            <Button size="sm" variant="outline" onClick={() => mStatus.mutate({ id: w.id, status: "inactive" })} disabled={mStatus.isPending}>
                              নিষ্ক্রিয়
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => mVerify.mutate({ id: w.id, is_verified: !w.is_verified })} disabled={mVerify.isPending}>
                            <BadgeCheck className="mr-1 h-3 w-3" /> {w.is_verified ? "যাচাই বাতিল" : "যাচাই"}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("মুছে ফেলবেন?")) mDelete.mutate({ id: w.id }); }} disabled={mDelete.isPending}>
                            {mDelete.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">কোনো তথ্য নেই।</td></tr>}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function CategoryRowEditor({ cat, onSave, onDelete, pending }: {
  cat: CategoryRow;
  onSave: (v: { id: string; name_bn: string; slug: string; sort_order: number; is_active: boolean }) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState({ name_bn: cat.name_bn, slug: cat.slug, sort_order: String(cat.sort_order), is_active: cat.is_active });
  if (!edit) {
    return (
      <tr className="border-b last:border-0">
        <td className="p-3 font-medium">{cat.name_bn}</td>
        <td className="p-3 text-muted-foreground">{cat.slug}</td>
        <td className="p-3">{cat.sort_order}</td>
        <td className="p-3">{cat.is_active ? "হ্যাঁ" : "না"}</td>
        <td className="p-3 text-right">
          <Button size="sm" variant="outline" onClick={() => setEdit(true)}><Pencil className="mr-1 h-3 w-3" /> এডিট</Button>
          <Button size="sm" variant="ghost" className="ml-1 text-destructive" onClick={() => { if (confirm("মুছে ফেলবেন?")) onDelete(cat.id); }} disabled={pending}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </td>
      </tr>
    );
  }
  return (
    <tr className="border-b bg-muted/20 last:border-0">
      <td className="p-2"><Input value={v.name_bn} onChange={(e) => setV({ ...v, name_bn: e.target.value })} /></td>
      <td className="p-2"><Input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} /></td>
      <td className="p-2"><Input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: e.target.value })} /></td>
      <td className="p-2">
        <select className="rounded border bg-background px-2 py-1" value={v.is_active ? "1" : "0"} onChange={(e) => setV({ ...v, is_active: e.target.value === "1" })}>
          <option value="1">হ্যাঁ</option>
          <option value="0">না</option>
        </select>
      </td>
      <td className="p-2 text-right">
        <Button size="sm" onClick={() => { onSave({ id: cat.id, name_bn: v.name_bn.trim(), slug: v.slug.trim(), sort_order: Number(v.sort_order) || 50, is_active: v.is_active }); setEdit(false); }} disabled={pending}>সংরক্ষণ</Button>
        <Button size="sm" variant="ghost" className="ml-1" onClick={() => setEdit(false)}>বাতিল</Button>
      </td>
    </tr>
  );
}
