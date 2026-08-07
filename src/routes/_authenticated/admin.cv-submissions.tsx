import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, FileText, Printer, Search, Trash2, CheckCircle2, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CVPreview } from "@/components/cv-builder/preview";
import { TEMPLATES, type CVData } from "@/lib/cv-builder/types";
import {
  deleteCVSubmission,
  listCVSubmissions,
  updateCVSubmissionAdmin,
  type CVSubmissionRow,
} from "@/lib/cv-submissions.functions";

export const Route = createFileRoute("/_authenticated/admin/cv-submissions")({
  head: () => ({
    meta: [
      { title: "সিভি সাবমিশন — অ্যাডমিন" },
      { name: "description", content: "ব্যবহারকারীদের তৈরি সিভি ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCVSubmissions,
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });

function AdminCVSubmissions() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listCVSubmissions);
  const removeFn = useServerFn(deleteCVSubmission);
  const patchFn = useServerFn(updateCVSubmissionAdmin);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [language, setLanguage] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [viewing, setViewing] = useState<CVSubmissionRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CVSubmissionRow | null>(null);
  const [notesFor, setNotesFor] = useState<CVSubmissionRow | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "cv-submissions"],
    queryFn: () => fetchAll(),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "cv-submissions"] });

  const del = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => { toast.success("সাবমিশন মুছে ফেলা হয়েছে"); setConfirmDelete(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: (v: { id: string; admin_notes?: string; reviewed?: boolean }) => patchFn({ data: v }),
    onSuccess: () => { toast.success("আপডেট হয়েছে"); setNotesFor(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const languages = useMemo(
    () => Array.from(new Set(rows.map((r) => r.language).filter(Boolean))),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : null;
    const out = rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (language !== "all" && r.language !== language) return false;
      const ts = new Date(r.created_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (!needle) return true;
      return [r.full_name, r.email, r.phone, r.job_title, r.cv_name, r.id]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    out.sort((a, b) => {
      const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "newest" ? -d : d;
    });
    return out;
  }, [rows, q, status, language, from, to, sort]);

  const stats = useMemo(() => {
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let today = 0, month = 0, completed = 0, draft = 0;
    for (const r of rows) {
      const ts = new Date(r.created_at).getTime();
      if (ts >= startDay) today++;
      if (ts >= startMonth) month++;
      if (r.status === "completed") completed++; else draft++;
    }
    return { total: rows.length, today, month, completed, draft };
  }, [rows]);

  const handlePrint = () => setTimeout(() => window.print(), 80);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          #admin-cv-print, #admin-cv-print * { visibility: visible !important; }
          #admin-cv-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="no-print grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "মোট সিভি", value: stats.total },
          { label: "আজকের সিভি", value: stats.today },
          { label: "এই মাসে", value: stats.month },
          { label: "সম্পূর্ণ", value: stats.completed },
          { label: "খসড়া", value: stats.draft },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.value.toLocaleString("bn-BD")}</div>
          </Card>
        ))}
      </div>

      <Card className="no-print p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Label className="text-xs">খুঁজুন (নাম / ইমেইল / ফোন)</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, ইমেইল, ফোন…" />
            </div>
          </div>
          <div>
            <Label className="text-xs">স্ট্যাটাস</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="completed">সম্পূর্ণ</SelectItem>
                <SelectItem value="draft">খসড়া</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">ভাষা</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">সাজান</Label>
            <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">নতুন আগে</SelectItem>
                <SelectItem value="oldest">পুরনো আগে</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">তারিখ (থেকে)</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">তারিখ (পর্যন্ত)</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="no-print overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">নাম</th>
              <th className="px-3 py-2">ফোন</th>
              <th className="px-3 py-2">ইমেইল</th>
              <th className="px-3 py-2">পদের নাম</th>
              <th className="px-3 py-2">টেমপ্লেট</th>
              <th className="px-3 py-2">ভাষা</th>
              <th className="px-3 py-2">তৈরি</th>
              <th className="px-3 py-2">সর্বশেষ আপডেট</th>
              <th className="px-3 py-2">স্ট্যাটাস</th>
              <th className="px-3 py-2 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">লোড হচ্ছে…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">কোনো সাবমিশন নেই</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-accent/40">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.full_name || "—"}</div>
                  <div className="text-[11px] text-muted-foreground">ID: {r.id.slice(0, 8)}</div>
                </td>
                <td className="px-3 py-2">{r.phone || "—"}</td>
                <td className="px-3 py-2">{r.email || "—"}</td>
                <td className="px-3 py-2">{r.job_title || "—"}</td>
                <td className="px-3 py-2">{TEMPLATES.find((t) => t.id === r.template)?.label ?? r.template}</td>
                <td className="px-3 py-2">{r.language}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">{fmt(r.created_at)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">{fmt(r.updated_at)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                      {r.status === "completed" ? "সম্পূর্ণ" : "খসড়া"}
                    </Badge>
                    {r.reviewed_at && <Badge variant="outline" className="text-[10px]">পর্যালোচিত</Badge>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="বিস্তারিত দেখুন" onClick={() => setViewing(r)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="অ্যাডমিন নোট"
                      onClick={() => { setNotesFor(r); setNoteDraft(r.admin_notes ?? ""); }}
                    >
                      <StickyNote className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="পর্যালোচিত হিসেবে চিহ্নিত করুন"
                      onClick={() => patch.mutate({ id: r.id, reviewed: !r.reviewed_at })}
                    >
                      <CheckCircle2 className={r.reviewed_at ? "h-4 w-4 text-primary" : "h-4 w-4"} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" title="মুছুন" onClick={() => setConfirmDelete(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Read-only full CV */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> সম্পূর্ণ সিভি (রিড-অনলি)
            </DialogTitle>
            <DialogDescription>
              সাবমিশন আইডি: {viewing?.id}
            </DialogDescription>
          </DialogHeader>

          {viewing && (
            <div className="space-y-4">
              <div className="no-print grid gap-2 rounded-md border bg-muted/30 p-3 text-xs sm:grid-cols-2">
                <div><span className="text-muted-foreground">IP:</span> {viewing.ip_address || "—"}</div>
                <div className="truncate"><span className="text-muted-foreground">User-Agent:</span> {viewing.user_agent || "—"}</div>
                <div><span className="text-muted-foreground">তৈরি:</span> {fmt(viewing.created_at)}</div>
                <div><span className="text-muted-foreground">আপডেট:</span> {fmt(viewing.updated_at)}</div>
                {viewing.admin_notes && (
                  <div className="sm:col-span-2"><span className="text-muted-foreground">অ্যাডমিন নোট:</span> {viewing.admin_notes}</div>
                )}
              </div>

              <div id="admin-cv-print" ref={printRef} className="rounded-md border bg-white">
                {viewing.data ? <CVPreview data={viewing.data as CVData} /> : (
                  <div className="p-6 text-center text-sm text-muted-foreground">সিভি ডেটা পাওয়া যায়নি</div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="no-print">
            <Button variant="outline" onClick={() => setViewing(null)}>বন্ধ করুন</Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-1.5 h-4 w-4" /> PDF ডাউনলোড করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin notes */}
      <Dialog open={!!notesFor} onOpenChange={(o) => !o && setNotesFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>অ্যাডমিন নোট</DialogTitle>
            <DialogDescription>এই নোট শুধুমাত্র প্রশাসকরা দেখতে পাবেন।</DialogDescription>
          </DialogHeader>
          <Textarea rows={5} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} maxLength={4000} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesFor(null)}>বাতিল</Button>
            <Button
              disabled={patch.isPending}
              onClick={() => notesFor && patch.mutate({ id: notesFor.id, admin_notes: noteDraft })}
            >
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>সাবমিশন মুছে ফেলবেন?</DialogTitle>
            <DialogDescription>
              {confirmDelete?.full_name || "এই সিভি"} — এই কাজটি ফিরিয়ে আনা যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>বাতিল</Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={() => confirmDelete && del.mutate(confirmDelete.id)}
            >
              মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
