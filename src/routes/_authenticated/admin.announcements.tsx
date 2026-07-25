import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { formatBanglaDate } from "@/lib/bangla";
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_PRIORITIES, categoryMeta, priorityLabel } from "@/lib/announcement-constants";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["announcements"]["Row"];
type Category = typeof ANNOUNCEMENT_CATEGORIES[number]["value"];
type Priority = typeof ANNOUNCEMENT_PRIORITIES[number]["value"];

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({
    meta: [
      { title: "নোটিশ ব্যবস্থাপনা — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "সরকারি নোটিশ, বিদ্যুৎ বিভ্রাট এবং ট্যারিফ পরিবর্তনের ঘোষণা ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAnnouncements,
});

type FormState = {
  id?: string;
  title: string;
  body: string;
  category: Category;
  priority: Priority;
  location: string;
  starts_at: string;
  ends_at: string;
  is_published: boolean;
};

const empty: FormState = {
  title: "", body: "", category: "notice", priority: "normal",
  location: "", starts_at: "", ends_at: "", is_published: true,
};

function AdminAnnouncements() {
  const { user } = useAuth();
  const [items, setItems] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const load = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) { toast.error("লোড করতে ব্যর্থ"); setItems([]); return; }
    setItems(data ?? []);
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (r: Row) => {
    setForm({
      id: r.id, title: r.title, body: r.body,
      category: (r.category ?? "notice") as Category,
      priority: r.priority as Priority,
      location: r.location ?? "",
      starts_at: r.starts_at ? r.starts_at.slice(0, 16) : "",
      ends_at: r.ends_at ? r.ends_at.slice(0, 16) : "",
      is_published: r.is_published,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.body.trim()) { toast.error("শিরোনাম ও বিবরণ আবশ্যক"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        priority: form.priority,
        location: form.location.trim() || null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_published: form.is_published,
        published_by: user.id,
      };
      const { error } = form.id
        ? await supabase.from("announcements").update(payload).eq("id", form.id)
        : await supabase.from("announcements").insert(payload);
      if (error) throw error;
      toast.success(form.id ? "আপডেট হয়েছে" : "প্রকাশিত হয়েছে");
      setOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ");
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("এই নোটিশ মুছে ফেলবেন?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("মুছে ফেলা হয়েছে");
    void load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">নোটিশ ব্যবস্থাপনা</h2>
          <p className="text-sm text-muted-foreground">সরকারি নোটিশ, বিদ্যুৎ বিভ্রাট ও ট্যারিফ ঘোষণা।</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> নতুন নোটিশ</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{form.id ? "নোটিশ সম্পাদনা" : "নতুন নোটিশ"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>শিরোনাম</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>ধরন</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>অগ্রাধিকার</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>বিবরণ</Label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} maxLength={2000} />
              </div>
              <div className="grid gap-2">
                <Label>এলাকা (ঐচ্ছিক)</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="যেমন: সমগ্র উখিয়া" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>শুরুর সময় (ঐচ্ছিক)</Label>
                  <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>শেষ সময় (ঐচ্ছিক)</Label>
                  <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>প্রকাশিত</Label>
                  <p className="text-xs text-muted-foreground">বন্ধ থাকলে জনসম্মুখে দেখা যাবে না।</p>
                </div>
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
              <Button onClick={() => void save()} disabled={saving}>{saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items === null ? (
        <div className="grid gap-3">{[0, 1, 2].map((i) => <Card key={i}><CardContent className="h-24 animate-pulse p-4" /></Card>)}</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <Megaphone className="h-8 w-8" /> এখনো কোনো নোটিশ নেই
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((r) => {
            const cat = categoryMeta(r.category);
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cat.tone}>{cat.label}</Badge>
                        <Badge variant="secondary">{priorityLabel(r.priority)}</Badge>
                        {!r.is_published && <Badge variant="outline">খসড়া</Badge>}
                        <span className="text-xs text-muted-foreground">{formatBanglaDate(r.published_at)}</span>
                      </div>
                      <div className="mt-2 font-semibold">{r.title}</div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.body}</p>
                      {r.location && <p className="mt-1 text-xs text-muted-foreground">📍 {r.location}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="সম্পাদনা">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => void remove(r.id)} aria-label="মুছুন" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
