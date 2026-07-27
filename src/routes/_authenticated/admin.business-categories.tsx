import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { BusinessCategory } from "@/lib/business-shared";
import { upsertBusinessCategory, deleteBusinessCategory } from "@/lib/business.functions";

export const Route = createFileRoute("/_authenticated/admin/business-categories")({
  head: () => ({ meta: [{ title: "ব্যবসা ক্যাটাগরি — অ্যাডমিন" }, { name: "robots", content: "noindex" }] }),
  component: AdminBusinessCategories,
});

function AdminBusinessCategories() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name_bn: "", slug: "", group_bn: "", icon: "", sort_order: 0 });

  const q = useQuery({
    queryKey: ["admin-biz-cats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_categories").select("*").order("group_bn").order("sort_order");
      if (error) throw error;
      return data as BusinessCategory[];
    },
  });

  const create = useMutation({
    mutationFn: () => upsertBusinessCategory({ data: { ...form, is_active: true } }),
    onSuccess: () => {
      toast.success("যোগ হয়েছে");
      setForm({ name_bn: "", slug: "", group_bn: "", icon: "", sort_order: 0 });
      qc.invalidateQueries({ queryKey: ["admin-biz-cats"] });
      qc.invalidateQueries({ queryKey: ["biz-categories"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggle = useMutation({
    mutationFn: (c: BusinessCategory) => upsertBusinessCategory({ data: { ...c, icon: c.icon ?? undefined, is_active: !c.is_active } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-biz-cats"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteBusinessCategory({ data: { id } }),
    onSuccess: () => { toast.success("ডিলিট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin-biz-cats"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">ব্যবসা ক্যাটাগরি</h2>

      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">নতুন ক্যাটাগরি</h3>
          <div className="grid gap-2 md:grid-cols-5">
            <div><Label>নাম (বাংলা)</Label><Input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} /></div>
            <div><Label>স্লাগ</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div>
            <div><Label>গ্রুপ</Label><Input value={form.group_bn} onChange={(e) => setForm({ ...form, group_bn: e.target.value })} placeholder="যেমন: খুচরা" /></div>
            <div><Label>আইকন (ইমোজি)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={4} /></div>
            <div className="flex items-end"><Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending || !form.name_bn || !form.slug || !form.group_bn}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} যোগ করুন
            </Button></div>
          </div>
        </CardContent>
      </Card>

      {q.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {(q.data ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <span className="text-xl">{c.icon || "🏷️"}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.name_bn} <span className="text-xs text-muted-foreground">/ {c.slug}</span></p>
                  <p className="text-xs text-muted-foreground">{c.group_bn}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={c.is_active} onCheckedChange={() => toggle.mutate(c)} />
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("ডিলিট করবেন?")) del.mutate(c.id); }}>
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
