import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, BookOpen, Loader2, ExternalLink } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { listResourcesAdmin, upsertResource, deleteResource, setResourcePublished } from "@/lib/education.functions";
import { RESOURCE_TYPES, STUDENT_CLASSES, type ResourceRow } from "@/lib/education-shared";
import { EducationImage } from "@/components/teachers/EducationImage";

export const Route = createFileRoute("/_authenticated/admin/study-resources")({
  component: AdminResources,
});

async function uploadThumb(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `resources/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("education-media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

function AdminResources() {
  const qc = useQueryClient();
  const listFn = useServerFn(listResourcesAdmin);
  const upFn = useServerFn(upsertResource);
  const delFn = useServerFn(deleteResource);
  const pubFn = useServerFn(setResourcePublished);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ResourceRow> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["admin","res"], queryFn: () => listFn(), staleTime: 15_000 });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin","res"] });

  async function save() {
    if (!editing) return; setBusy(true);
    try {
      let thumb = editing.thumbnail_url ?? null;
      if (file) thumb = await uploadThumb(file);
      await upFn({ data: {
        id: editing.id, title: editing.title || "", description: editing.description || null,
        student_class: editing.student_class || null, subject: editing.subject || null, category: editing.category || null,
        thumbnail_url: thumb, resource_type: (editing.resource_type as any) || "link",
        external_url: editing.external_url || "", is_published: !!editing.is_published,
        sort_order: editing.sort_order ?? 100,
      } });
      toast.success("সংরক্ষণ হয়েছে"); setOpen(false); setEditing(null); setFile(null); invalidate();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📚 শিক্ষা রিসোর্স</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditing({ resource_type: "link", is_published: false, sort_order: 100 }); setFile(null); }}><Plus className="mr-2 h-4 w-4" /> নতুন রিসোর্স</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? "রিসোর্স সম্পাদনা" : "নতুন রিসোর্স"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>শিরোনাম *</Label><Input value={editing?.title ?? ""} onChange={(e) => setEditing({ ...editing!, title: e.target.value })} /></div>
              <div><Label>বিবরণ</Label><Textarea rows={2} value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing!, description: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>শ্রেণি</Label>
                  <Select value={editing?.student_class ?? ""} onValueChange={(v) => setEditing({ ...editing!, student_class: v })}>
                    <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger><SelectContent>{STUDENT_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>বিষয়</Label><Input value={editing?.subject ?? ""} onChange={(e) => setEditing({ ...editing!, subject: e.target.value })} /></div>
                <div><Label>ক্যাটাগরি</Label><Input value={editing?.category ?? ""} onChange={(e) => setEditing({ ...editing!, category: e.target.value })} /></div>
                <div><Label>ধরন</Label>
                  <Select value={(editing?.resource_type as string) ?? "link"} onValueChange={(v) => setEditing({ ...editing!, resource_type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESOURCE_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>
              <div><Label>External URL *</Label><Input value={editing?.external_url ?? ""} onChange={(e) => setEditing({ ...editing!, external_url: e.target.value })} placeholder="https://…" /></div>
              <div>
                <Label>থাম্বনেইল</Label>
                <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-accent">
                  <Upload className="h-4 w-4" />{file ? file.name : editing?.thumbnail_url ? "নতুন ছবি" : "ছবি বাছুন"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="p" checked={!!editing?.is_published} onChange={(e) => setEditing({ ...editing!, is_published: e.target.checked })} /><Label htmlFor="p">প্রকাশ করুন</Label></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button><Button onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} সংরক্ষণ</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? <div className="grid gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> :
        (q.data ?? []).length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground"><BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" /> কোনো রিসোর্স নেই।</Card> :
        <div className="grid gap-3">
          {(q.data ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.title}</h3>
                    <Badge variant="outline" className="text-xs">{RESOURCE_TYPES.find((x) => x.value === r.resource_type)?.label}</Badge>
                    {r.is_published ? <Badge className="bg-secondary text-secondary-foreground">প্রকাশিত</Badge> : <Badge variant="outline">খসড়া</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{[r.student_class, r.subject, r.category].filter(Boolean).join(" · ")}</p>
                  <a href={r.external_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" /> {r.external_url}</a>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { try { await pubFn({ data: { id: r.id, is_published: !r.is_published } }); invalidate(); } catch (e) { toast.error((e as Error).message); } }}>{r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(r); setFile(null); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={async () => { if (!confirm("মুছবেন?")) return; try { await delFn({ data: { id: r.id } }); invalidate(); } catch (e) { toast.error((e as Error).message); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
