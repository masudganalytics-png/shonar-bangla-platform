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
import type { CategoryRow } from "@/lib/teachers-shared";
import { listAllTeachers, setTeacherStatus, setTeacherVerified, deleteTeacherAdmin, upsertTeacherCategory, deleteTeacherCategory, createTeacherAdmin, type AdminTeacher } from "@/lib/teachers.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBanglaDate, toBanglaDigits as toBnNum } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/teachers")({
  component: AdminTeachers,
});

function AdminTeachers() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "inactive" | "categories">("pending");
  const [search, setSearch] = useState("");

  const statusFn = useServerFn(setTeacherStatus);
  const verifyFn = useServerFn(setTeacherVerified);
  const delFn = useServerFn(deleteTeacherAdmin);
  const upsertCatFn = useServerFn(upsertTeacherCategory);
  const delCatFn = useServerFn(deleteTeacherCategory);
  const createFn = useServerFn(createTeacherAdmin);

  const tq = useQuery({
    queryKey: ["admin", "teachers"],
    queryFn: () => listAllTeachers(),
    staleTime: 15_000,
  });

  const cq = useQuery({
    queryKey: ["teacher-categories", "admin"],
    queryFn: async (): Promise<CategoryRow[]> => {
      const { data, error } = await supabase.from("teacher_categories").select("*").order("sort_order").order("name_bn");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "teachers"] });

  const mStatus = useMutation({ mutationFn: (v: { id: string; status: AdminTeacher["status"] }) => statusFn({ data: v }), onSuccess: () => { toast.success("স্ট্যাটাস আপডেট"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const mVerify = useMutation({ mutationFn: (v: { id: string; is_verified: boolean }) => verifyFn({ data: v }), onSuccess: () => { toast.success("যাচাই আপডেট"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const mDelete = useMutation({ mutationFn: (v: { id: string }) => delFn({ data: v }), onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  const mCat = useMutation({
    mutationFn: (v: { id?: string; name_bn: string; slug: string; sort_order: number; is_active: boolean }) => upsertCatFn({ data: v }),
    onSuccess: () => { toast.success("ক্যাটাগরি সংরক্ষণ হয়েছে"); qc.invalidateQueries({ queryKey: ["teacher-categories"] }); qc.invalidateQueries({ queryKey: ["teacher-categories", "admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelCat = useMutation({
    mutationFn: (v: { id: string }) => delCatFn({ data: v }),
    onSuccess: () => { toast.success("ক্যাটাগরি মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["teacher-categories"] }); qc.invalidateQueries({ queryKey: ["teacher-categories", "admin"] }); },
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

  const filtered = (tq.data ?? []).filter((t) => {
    if (tab === "categories") return false;
    if (t.status !== tab) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return [t.full_name, t.phone, t.area, t.category_name, t.subjects].some((f) => (f ?? "").toLowerCase().includes(s));
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
        <AddTeacherDialog
          categories={cq.data ?? []}
          onCreate={async (v) => {
            await createFn({ data: v });
            toast.success("শিক্ষক যোগ হয়েছে");
            invalidate();
            setTab(v.status);
          }}
        />
      </div>

      {tab === "categories" ? (
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">নতুন বিষয় ক্যাটাগরি যোগ করুন</h2>
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
          <Input placeholder="নাম / ফোন / এলাকা / বিষয়…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

          {tq.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <Card className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">নাম</th>
                    <th className="p-3 text-left">বিষয়</th>
                    <th className="p-3 text-left">যোগাযোগ</th>
                    <th className="p-3 text-left">এলাকা</th>
                    <th className="p-3 text-left">যোগ্যতা</th>
                    <th className="p-3 text-left">অবস্থা</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 align-top">
                      <td className="p-3">
                        <div className="flex items-center gap-1 font-medium">
                          {t.full_name}
                          {t.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                        </div>
                        {t.experience_years ? <div className="text-xs text-muted-foreground">{t.experience_years}+ বছর</div> : null}
                      </td>
                      <td className="p-3 text-muted-foreground">{t.category_name ?? "—"}</td>
                      <td className="p-3">
                        <div>{t.phone}</div>
                        {t.whatsapp && <div className="text-xs text-muted-foreground">WA: {t.whatsapp}</div>}
                      </td>
                      <td className="p-3 text-muted-foreground">{[t.area, t.upazila].filter(Boolean).join(", ") || "—"}</td>
                      <td className="p-3 text-muted-foreground">{t.qualification || "—"}</td>
                      <td className="p-3">
                        {t.status === "approved" && <Badge className="bg-secondary text-secondary-foreground">অনুমোদিত</Badge>}
                        {t.status === "pending" && <Badge variant="outline">অপেক্ষমাণ</Badge>}
                        {t.status === "rejected" && <Badge variant="destructive">প্রত্যাখ্যাত</Badge>}
                        {t.status === "inactive" && <Badge variant="outline">নিষ্ক্রিয়</Badge>}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap justify-end gap-1">
                          {t.status !== "approved" && (
                            <Button size="sm" onClick={() => mStatus.mutate({ id: t.id, status: "approved" })} disabled={mStatus.isPending}>
                              <CheckCircle2 className="mr-1 h-3 w-3" /> অনুমোদন
                            </Button>
                          )}
                          {t.status !== "rejected" && (
                            <Button size="sm" variant="outline" onClick={() => mStatus.mutate({ id: t.id, status: "rejected" })} disabled={mStatus.isPending}>
                              <XCircle className="mr-1 h-3 w-3" /> প্রত্যাখ্যান
                            </Button>
                          )}
                          {t.status === "approved" && (
                            <Button size="sm" variant="outline" onClick={() => mStatus.mutate({ id: t.id, status: "inactive" })} disabled={mStatus.isPending}>
                              নিষ্ক্রিয়
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => mVerify.mutate({ id: t.id, is_verified: !t.is_verified })} disabled={mVerify.isPending}>
                            <BadgeCheck className="mr-1 h-3 w-3" /> {t.is_verified ? "যাচাই বাতিল" : "যাচাই"}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("মুছে ফেলবেন?")) mDelete.mutate({ id: t.id }); }} disabled={mDelete.isPending}>
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

type NewTeacher = {
  full_name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  category_id?: string | null;
  subjects?: string | null;
  qualification?: string | null;
  experience_years?: number | null;
  district: string;
  upazila: string;
  area?: string | null;
  photo_url?: string | null;
  description?: string | null;
  is_available: boolean;
  is_verified: boolean;
  status: "pending" | "approved" | "rejected" | "inactive";
};

function AddTeacherDialog({ categories, onCreate }: {
  categories: CategoryRow[];
  onCreate: (v: NewTeacher) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", whatsapp: "", email: "", category_id: "",
    subjects: "", qualification: "", experience_years: "", district: "Cox's Bazar",
    upazila: "Ukhiya", area: "", description: "", photo_url: "",
    is_available: true, is_verified: false,
    status: "approved" as "pending" | "approved" | "rejected" | "inactive",
  });

  const reset = () => setForm({
    full_name: "", phone: "", whatsapp: "", email: "", category_id: "",
    subjects: "", qualification: "", experience_years: "", district: "Cox's Bazar",
    upazila: "Ukhiya", area: "", description: "", photo_url: "",
    is_available: true, is_verified: false, status: "approved",
  });

  async function handlePhoto(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `admin/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("teacher-images").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (error) throw error;
      setForm((f) => ({ ...f, photo_url: `teacher-images/${path}` }));
      toast.success("ছবি আপলোড হয়েছে");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("নাম ও ফোন নম্বর আবশ্যক");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        category_id: form.category_id || null,
        subjects: form.subjects.trim() || null,
        qualification: form.qualification.trim() || null,
        experience_years: form.experience_years === "" ? null : Number(form.experience_years),
        district: form.district.trim() || "Cox's Bazar",
        upazila: form.upazila.trim() || "Ukhiya",
        area: form.area.trim() || null,
        photo_url: form.photo_url || null,
        description: form.description.trim() || null,
        is_available: form.is_available,
        is_verified: form.is_verified,
        status: form.status,
      });
      reset();
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> নতুন শিক্ষক যোগ করুন</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>নতুন শিক্ষক যোগ করুন</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>পূর্ণ নাম *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label>ফোন *</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <div>
            <Label>ইমেইল</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>বিষয়</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">নির্বাচন করুন</option>
              {categories.filter((c) => c.is_active).map((c) => (
                <option key={c.id} value={c.id}>{c.name_bn}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>পড়ানো শ্রেণি (একাধিক নির্বাচন করা যাবে)</Label>
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-md border p-3 sm:grid-cols-4">
              {Array.from({ length: 12 }, (_, i) => `শ্রেণি ${toBnNum(i + 1)}`).map((cls) => {
                const selected = (form.subjects ? form.subjects.split(",").map((s) => s.trim()).filter(Boolean) : []);
                const checked = selected.includes(cls);
                return (
                  <label key={cls} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(cls); else next.delete(cls);
                        setForm({ ...form, subjects: Array.from(next).join(", ") });
                      }}
                    />
                    {cls}
                  </label>
                );
              })}
            </div>
            <Input
              className="mt-2"
              value={form.subjects}
              onChange={(e) => setForm({ ...form, subjects: e.target.value })}
              placeholder="অতিরিক্ত বিষয় (কমা দিয়ে আলাদা করুন)"
            />
          </div>
          <div>
            <Label>যোগ্যতা</Label>
            <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          </div>
          <div>
            <Label>অভিজ্ঞতা (বছর)</Label>
            <Input type="number" min="0" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
          </div>
          <div>
            <Label>জেলা</Label>
            <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>
          <div>
            <Label>উপজেলা</Label>
            <Input value={form.upazila} onChange={(e) => setForm({ ...form, upazila: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>এলাকা</Label>
            <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>সংক্ষিপ্ত পরিচিতি</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>প্রোফাইল ছবি</Label>
            <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }} />
            {uploading && <p className="mt-1 text-xs text-muted-foreground">আপলোড হচ্ছে…</p>}
            {form.photo_url && !uploading && <p className="mt-1 text-xs text-secondary">ছবি প্রস্তুত ✓</p>}
          </div>
          <div>
            <Label>স্ট্যাটাস</Label>
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
            >
              <option value="approved">অনুমোদিত</option>
              <option value="pending">অপেক্ষমাণ</option>
              <option value="inactive">নিষ্ক্রিয়</option>
              <option value="rejected">প্রত্যাখ্যাত</option>
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_verified} onChange={(e) => setForm({ ...form, is_verified: e.target.checked })} />
              যাচাইকৃত
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              এখন উপলব্ধ
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>বাতিল</Button>
          <Button onClick={submit} disabled={saving || uploading}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            সংরক্ষণ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
