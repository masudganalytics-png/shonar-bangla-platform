import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Loader2, Pencil, Plus, Trash2, Upload, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { formatBanglaDate } from "@/lib/bangla";
import { downloadCsv } from "@/lib/download";
import {
  listAllAdvocates, upsertAdvocate, deleteAdvocate,
  listAllLeads, updateLead, deleteLead,
} from "@/lib/legal.functions";
import {
  PRACTICE_AREAS, LANGUAGES, LEAD_STATUS_LABELS,
  practiceAreaLabel, type AdvocateRow, type LegalLeadRow,
} from "@/lib/legal-shared";

export const Route = createFileRoute("/_authenticated/admin/legal")({
  component: AdminLegal,
});

type AdvocateInput = ReturnType<typeof toEditable> | Omit<ReturnType<typeof toEditable>, "id">;

function AdminLegal() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"advocates" | "leads">("advocates");

  const advocatesQ = useQuery({ queryKey: ["admin", "advocates"], queryFn: () => listAllAdvocates() });
  const leadsQ = useQuery({ queryKey: ["admin", "legal-leads"], queryFn: () => listAllLeads(), enabled: tab === "leads" });

  const upsertFn = useServerFn(upsertAdvocate);
  const delAdvFn = useServerFn(deleteAdvocate);
  const updLeadFn = useServerFn(updateLead);
  const delLeadFn = useServerFn(deleteLead);

  const mUpsert = useMutation({
    mutationFn: (v: AdvocateInput) => upsertFn({ data: v }),
    onSuccess: () => { toast.success("সংরক্ষণ হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "advocates"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelAdv = useMutation({
    mutationFn: (v: { id: string }) => delAdvFn({ data: v }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "advocates"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mUpdLead = useMutation({
    mutationFn: (v: { id: string; status?: "new" | "contacted" | "closed"; admin_note?: string | null }) => updLeadFn({ data: v }),
    onSuccess: () => { toast.success("আপডেট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "legal-leads"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelLead = useMutation({
    mutationFn: (v: { id: string }) => delLeadFn({ data: v }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "legal-leads"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1 w-fit">
        {(["advocates", "leads"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-md px-3 py-2 text-sm font-medium ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            {k === "advocates" ? "অ্যাডভোকেট" : "লিড"}
          </button>
        ))}
      </div>

      {tab === "advocates" ? (
        <AdvocatesTab
          list={advocatesQ.data ?? []}
          loading={advocatesQ.isLoading}
          onSave={(v) => mUpsert.mutateAsync(v)}
          onToggleActive={(a) => mUpsert.mutate({ ...toEditable(a), is_active: !a.is_active })}
          onToggleVerified={(a) => mUpsert.mutate({ ...toEditable(a), is_verified: !a.is_verified })}
          onDelete={(id) => mDelAdv.mutate({ id })}
        />
      ) : (
        <LeadsTab
          list={leadsQ.data ?? []}
          advocates={advocatesQ.data ?? []}
          loading={leadsQ.isLoading}
          onUpdate={(v) => mUpdLead.mutate(v)}
          onDelete={(id) => mDelLead.mutate({ id })}
        />
      )}
    </div>
  );
}

function toEditable(a: AdvocateRow) {
  return {
    id: a.id,
    full_name: a.full_name,
    photo_url: a.photo_url,
    practice_areas: a.practice_areas ?? [],
    chamber_address: a.chamber_address,
    experience_years: a.experience_years,
    languages: a.languages ?? [],
    availability: a.availability,
    phone: a.phone,
    whatsapp: a.whatsapp,
    email: a.email,
    bio: a.bio,
    is_verified: a.is_verified,
    is_active: a.is_active,
    sort_order: a.sort_order,
  };
}

/* ---------------- Advocates tab ---------------- */

function AdvocatesTab({
  list, loading, onSave, onToggleActive, onToggleVerified, onDelete,
}: {
  list: AdvocateRow[];
  loading: boolean;
  onSave: (v: ReturnType<typeof toEditable> | Omit<ReturnType<typeof toEditable>, "id">) => Promise<unknown>;
  onToggleActive: (a: AdvocateRow) => void;
  onToggleVerified: (a: AdvocateRow) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = list.filter((a) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return [a.full_name, a.whatsapp, a.chamber_address, ...(a.practice_areas ?? []).map(practiceAreaLabel)]
      .filter(Boolean).some((f) => String(f).toLowerCase().includes(s));
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="নাম / WhatsApp / চেম্বার…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <AdvocateFormDialog
          trigger={<Button size="sm"><Plus className="mr-1 h-4 w-4" /> নতুন অ্যাডভোকেট</Button>}
          onSave={onSave}
        />
      </div>

      {loading ? <Skeleton className="h-72 w-full" /> : (
        <Card className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">নাম</th>
                <th className="p-3 text-left">দক্ষতা</th>
                <th className="p-3 text-left">যোগাযোগ</th>
                <th className="p-3 text-left">অবস্থা</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b last:border-0 align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-1 font-medium">
                      অ্যাডভোকেট {a.full_name}
                      {a.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </div>
                    {a.experience_years ? <div className="text-xs text-muted-foreground">{a.experience_years}+ বছর</div> : null}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <div className="flex flex-wrap gap-1">
                      {(a.practice_areas ?? []).slice(0, 4).map((pa) => (
                        <Badge key={pa} variant="outline" className="text-[10px]">{practiceAreaLabel(pa)}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>WA: {a.whatsapp}</div>
                    {a.phone && <div className="text-xs text-muted-foreground">{a.phone}</div>}
                  </td>
                  <td className="p-3">
                    {a.is_active ? <Badge className="bg-secondary text-secondary-foreground">সক্রিয়</Badge> : <Badge variant="outline">নিষ্ক্রিয়</Badge>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => onToggleVerified(a)}>
                        <BadgeCheck className="mr-1 h-3 w-3" /> {a.is_verified ? "যাচাই বাতিল" : "যাচাই"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onToggleActive(a)}>
                        {a.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                      </Button>
                      <AdvocateFormDialog
                        initial={a}
                        trigger={<Button size="sm" variant="outline"><Pencil className="mr-1 h-3 w-3" /> এডিট</Button>}
                        onSave={onSave}
                      />
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("মুছে ফেলবেন?")) onDelete(a.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">কোনো অ্যাডভোকেট নেই।</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function AdvocateFormDialog({
  initial, trigger, onSave,
}: {
  initial?: AdvocateRow;
  trigger: React.ReactNode;
  onSave: (v: ReturnType<typeof toEditable> | Omit<ReturnType<typeof toEditable>, "id">) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const empty = {
    full_name: "", photo_url: "" as string | null, practice_areas: [] as string[],
    chamber_address: "", experience_years: "" as string, languages: [] as string[],
    availability: "", phone: "", whatsapp: "", email: "", bio: "",
    is_verified: false, is_active: true, sort_order: 100,
  };
  const [form, setForm] = useState<typeof empty>(() => initial ? {
    full_name: initial.full_name,
    photo_url: initial.photo_url,
    practice_areas: initial.practice_areas ?? [],
    chamber_address: initial.chamber_address ?? "",
    experience_years: initial.experience_years?.toString() ?? "",
    languages: initial.languages ?? [],
    availability: initial.availability ?? "",
    phone: initial.phone ?? "",
    whatsapp: initial.whatsapp,
    email: initial.email ?? "",
    bio: initial.bio ?? "",
    is_verified: initial.is_verified,
    is_active: initial.is_active,
    sort_order: initial.sort_order,
  } : empty);

  const togglePracticeArea = (v: string) =>
    setForm((f) => ({ ...f, practice_areas: f.practice_areas.includes(v) ? f.practice_areas.filter((x) => x !== v) : [...f.practice_areas, v] }));
  const toggleLanguage = (v: string) =>
    setForm((f) => ({ ...f, languages: f.languages.includes(v) ? f.languages.filter((x) => x !== v) : [...f.languages, v] }));

  async function handlePhoto(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `admin/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("advocate-images").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setForm((f) => ({ ...f, photo_url: `advocate-images/${path}` }));
      toast.success("ছবি আপলোড হয়েছে");
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  }

  async function submit() {
    if (!form.full_name.trim() || !form.whatsapp.trim()) { toast.error("নাম ও WhatsApp আবশ্যক"); return; }
    setSaving(true);
    try {
      const values = {
        ...(initial ? { id: initial.id } : {}),
        full_name: form.full_name.trim(),
        photo_url: form.photo_url || null,
        practice_areas: form.practice_areas,
        chamber_address: form.chamber_address.trim() || null,
        experience_years: form.experience_years === "" ? null : Number(form.experience_years),
        languages: form.languages,
        availability: form.availability.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.replace(/[\s-]/g, ""),
        email: form.email.trim() || null,
        bio: form.bio.trim() || null,
        is_verified: form.is_verified,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 100,
      };
      await onSave(values);
      setOpen(false);
      if (!initial) setForm(empty);
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "অ্যাডভোকেট এডিট" : "নতুন অ্যাডভোকেট"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>পূর্ণ নাম *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label>WhatsApp নম্বর *</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="01XXXXXXXXX" inputMode="tel" />
          </div>
          <div>
            <Label>ফোন নম্বর</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
          </div>
          <div className="sm:col-span-2">
            <Label>ইমেইল</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
          </div>
          <div className="sm:col-span-2">
            <Label>চেম্বার ঠিকানা</Label>
            <Input value={form.chamber_address} onChange={(e) => setForm({ ...form, chamber_address: e.target.value })} />
          </div>
          <div>
            <Label>অভিজ্ঞতা (বছর)</Label>
            <Input type="number" min={0} max={80} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
          </div>
          <div>
            <Label>উপলব্ধতা</Label>
            <Input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="যেমন: শনি-বৃহঃ, ১০টা-৭টা" />
          </div>
          <div className="sm:col-span-2">
            <Label>দক্ষতা / আইনি বিষয়</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRACTICE_AREAS.map((p) => (
                <label key={p.value} className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-sm">
                  <Checkbox checked={form.practice_areas.includes(p.value)} onCheckedChange={() => togglePracticeArea(p.value)} />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>ভাষা</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <label key={l} className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-sm">
                  <Checkbox checked={form.languages.includes(l)} onCheckedChange={() => toggleLanguage(l)} />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>পরিচিতি</Label>
            <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>প্রোফাইল ছবি</Label>
            <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-accent">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {form.photo_url ? "ছবি পরিবর্তন করুন" : "ছবি নির্বাচন করুন"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }} />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ver" checked={form.is_verified} onCheckedChange={(v) => setForm({ ...form, is_verified: Boolean(v) })} />
            <Label htmlFor="ver">যাচাইকৃত</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="act" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: Boolean(v) })} />
            <Label htmlFor="act">সক্রিয়</Label>
          </div>
          <div>
            <Label>ক্রম</Label>
            <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>বাতিল</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            সংরক্ষণ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Leads tab ---------------- */

function LeadsTab({
  list, advocates, loading, onUpdate, onDelete,
}: {
  list: LegalLeadRow[];
  advocates: AdvocateRow[];
  loading: boolean;
  onUpdate: (v: { id: string; status?: "new" | "contacted" | "closed"; admin_note?: string | null }) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [advocateId, setAdvocateId] = useState<string>("all");

  const advMap = useMemo(() => new Map(advocates.map((a) => [a.id, a])), [advocates]);

  const filtered = list.filter((l) => {
    if (status !== "all" && l.status !== status) return false;
    if (advocateId !== "all" && l.advocate_id !== advocateId) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return [l.full_name, l.phone, l.category, l.description].filter(Boolean).some((f) => String(f).toLowerCase().includes(s));
  });

  function exportCsv() {
    const header = ["তারিখ", "নাম", "মোবাইল", "বিষয়", "বিবরণ", "অ্যাডভোকেট", "স্ট্যাটাস", "নোট"];
    const rows = filtered.map((l) => [
      l.created_at,
      l.full_name,
      l.phone,
      practiceAreaLabel(l.category),
      l.description ?? "",
      l.advocate_id ? (advMap.get(l.advocate_id)?.full_name ?? "") : "",
      LEAD_STATUS_LABELS[l.status] ?? l.status,
      l.admin_note ?? "",
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map((c) => escape(String(c))).join(",")).join("\n");
    downloadCsv(`legal-leads-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="নাম / মোবাইল / বিষয়…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={advocateId} onValueChange={setAdvocateId}>
          <SelectTrigger><SelectValue placeholder="অ্যাডভোকেট" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব অ্যাডভোকেট</SelectItem>
            {advocates.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1 h-3 w-3" /> CSV এক্সপোর্ট</Button>
      </div>

      {loading ? <Skeleton className="h-72 w-full" /> : (
        <Card className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">তারিখ</th>
                <th className="p-3 text-left">নাম</th>
                <th className="p-3 text-left">মোবাইল</th>
                <th className="p-3 text-left">বিষয়</th>
                <th className="p-3 text-left">অ্যাডভোকেট</th>
                <th className="p-3 text-left">স্ট্যাটাস</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b last:border-0 align-top">
                  <td className="p-3 text-xs text-muted-foreground">{formatBanglaDate(l.created_at)}</td>
                  <td className="p-3 font-medium">{l.full_name}</td>
                  <td className="p-3">{l.phone}</td>
                  <td className="p-3">
                    <div>{practiceAreaLabel(l.category)}</div>
                    {l.description && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{l.description}</div>}
                  </td>
                  <td className="p-3 text-muted-foreground">{l.advocate_id ? advMap.get(l.advocate_id)?.full_name ?? "—" : "—"}</td>
                  <td className="p-3">
                    <Select value={l.status} onValueChange={(v) => onUpdate({ id: l.id, status: v as LegalLeadRow["status"] })}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("মুছে ফেলবেন?")) onDelete(l.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">কোনো লিড নেই।</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
