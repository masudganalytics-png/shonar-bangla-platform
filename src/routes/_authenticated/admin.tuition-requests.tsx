import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Phone, User, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { listTuitionRequestsAdmin, upsertTuitionRequestAdmin, setTuitionRequestStatus, deleteTuitionRequestAdmin } from "@/lib/education.functions";
import { STUDENT_CLASSES, TUITION_MODES, TUITION_STATUS_LABEL, TUTOR_GENDERS, type TuitionRequestAdmin } from "@/lib/education-shared";
import { UPAZILAS, DISTRICTS } from "@/lib/teachers-shared";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/tuition-requests")({
  component: AdminTuitionRequests,
});

const STATUSES = ["pending","approved","rejected","matched","filled","closed"] as const;

function AdminTuitionRequests() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof STATUSES)[number]>("pending");
  const [editing, setEditing] = useState<Partial<TuitionRequestAdmin> | null>(null);
  const [open, setOpen] = useState(false);
  const listFn = useServerFn(listTuitionRequestsAdmin);
  const upsertFn = useServerFn(upsertTuitionRequestAdmin);
  const statusFn = useServerFn(setTuitionRequestStatus);
  const delFn = useServerFn(deleteTuitionRequestAdmin);

  const q = useQuery({ queryKey: ["admin","tuitions"], queryFn: () => listFn(), staleTime: 15_000 });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin","tuitions"] });

  async function handleSave() {
    if (!editing) return;
    try {
      await upsertFn({ data: {
        id: editing.id, parent_name: editing.parent_name || "অ্যাডমিন-যোগকৃত", phone: editing.phone || "00000000000",
        district: editing.district || "Cox's Bazar", upazila: editing.upazila || "Ukhiya", area: editing.area ?? null,
        student_class: editing.student_class || "", subject: editing.subject || "",
        preferred_gender: (editing.preferred_gender as any) || "any",
        budget: (editing.budget as any) ?? null, days_per_week: (editing.days_per_week as any) ?? null,
        preferred_time: editing.preferred_time ?? null, mode: (editing.mode as any) || "offline",
        notes: editing.notes ?? null, status: (editing.status as any) || "approved",
        matched_tutor_id: editing.matched_tutor_id ?? null,
      } });
      toast.success("সংরক্ষণ হয়েছে"); setOpen(false); setEditing(null); invalidate();
    } catch (e) { toast.error((e as Error).message); }
  }

  const items = (q.data ?? []).filter((r) => r.status === tab);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">📚 টিউশন রিকোয়েস্ট ব্যবস্থাপনা</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => setEditing({ status: "approved", preferred_gender: "any", mode: "offline", district: "Cox's Bazar", upazila: "Ukhiya" })}><Plus className="mr-2 h-4 w-4" /> নতুন যোগ করুন</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? "টিউশন সম্পাদনা" : "নতুন টিউশন যোগ করুন"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>অভিভাবক নাম</Label><Input value={editing?.parent_name ?? ""} onChange={(e) => setEditing({ ...editing!, parent_name: e.target.value })} /></div>
              <div><Label>ফোন</Label><Input value={editing?.phone ?? ""} onChange={(e) => setEditing({ ...editing!, phone: e.target.value })} /></div>
              <div><Label>জেলা</Label>
                <Select value={editing?.district ?? "Cox's Bazar"} onValueChange={(v) => setEditing({ ...editing!, district: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>উপজেলা</Label>
                <Select value={editing?.upazila ?? "Ukhiya"} onValueChange={(v) => setEditing({ ...editing!, upazila: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UPAZILAS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="sm:col-span-2"><Label>এলাকা</Label><Input value={editing?.area ?? ""} onChange={(e) => setEditing({ ...editing!, area: e.target.value })} /></div>
              <div><Label>শ্রেণি</Label>
                <Select value={editing?.student_class ?? ""} onValueChange={(v) => setEditing({ ...editing!, student_class: v })}>
                  <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{STUDENT_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>বিষয়</Label><Input value={editing?.subject ?? ""} onChange={(e) => setEditing({ ...editing!, subject: e.target.value })} /></div>
              <div><Label>পছন্দের লিঙ্গ</Label>
                <Select value={(editing?.preferred_gender as string) ?? "any"} onValueChange={(v) => setEditing({ ...editing!, preferred_gender: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TUTOR_GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>বাজেট</Label><Input type="number" value={editing?.budget ?? ""} onChange={(e) => setEditing({ ...editing!, budget: e.target.value === "" ? null : Number(e.target.value) })} /></div>
              <div><Label>সপ্তাহে দিন</Label><Input type="number" value={editing?.days_per_week ?? ""} onChange={(e) => setEditing({ ...editing!, days_per_week: e.target.value === "" ? null : Number(e.target.value) })} /></div>
              <div><Label>সময়</Label><Input value={editing?.preferred_time ?? ""} onChange={(e) => setEditing({ ...editing!, preferred_time: e.target.value })} /></div>
              <div><Label>ধরন</Label>
                <Select value={(editing?.mode as string) ?? "offline"} onValueChange={(v) => setEditing({ ...editing!, mode: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TUITION_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>স্ট্যাটাস</Label>
                <Select value={(editing?.status as string) ?? "approved"} onValueChange={(v) => setEditing({ ...editing!, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{TUITION_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="sm:col-span-2"><Label>নোট</Label><Textarea value={editing?.notes ?? ""} onChange={(e) => setEditing({ ...editing!, notes: e.target.value })} rows={3} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button><Button onClick={handleSave}>সংরক্ষণ</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button key={s} size="sm" variant={tab === s ? "default" : "outline"} onClick={() => setTab(s)}>
            {TUITION_STATUS_LABEL[s]} ({(q.data ?? []).filter((r) => r.status === s).length})
          </Button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="grid gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">কোনো এন্ট্রি নেই।</Card>
      ) : (
        <div className="grid gap-3">
          {items.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.subject} — {r.student_class}</h3>
                    <Badge variant="outline">{TUITION_STATUS_LABEL[r.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{[r.area, r.upazila, r.district].filter(Boolean).join(", ")} · {formatBanglaDate(r.created_at)}</p>
                  <p className="mt-1 text-sm"><User className="mr-1 inline h-3 w-3" /> {r.parent_name} · <Phone className="mr-1 inline h-3 w-3" /> {r.phone}</p>
                  {r.notes && <p className="mt-1 text-xs text-muted-foreground">{r.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={async () => { try { await statusFn({ data: { id: r.id, status: "approved" } }); toast.success("অনুমোদিত"); invalidate(); } catch (e) { toast.error((e as Error).message); } }}><CheckCircle2 className="mr-1 h-4 w-4" /> অনুমোদন</Button>
                      <Button size="sm" variant="outline" onClick={async () => { try { await statusFn({ data: { id: r.id, status: "rejected" } }); toast.success("প্রত্যাখ্যাত"); invalidate(); } catch (e) { toast.error((e as Error).message); } }}><XCircle className="mr-1 h-4 w-4" /> প্রত্যাখ্যান</Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={async () => { if (!confirm("মুছে ফেলবেন?")) return; try { await delFn({ data: { id: r.id } }); toast.success("মুছে ফেলা হয়েছে"); invalidate(); } catch (e) { toast.error((e as Error).message); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
