import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { listNewsAdmin, upsertNews, deleteNews, setNewsPublished } from "@/lib/education.functions";
import { EducationImage } from "@/components/teachers/EducationImage";
import type { EducationNewsRow } from "@/lib/education-shared";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/education-news")({
  component: AdminNews,
});

async function uploadCover(file: File): Promise<string> {
  return uploadImageToCloudinary(file, "ukhiya-seba/news");
}

function AdminNews() {
  const qc = useQueryClient();
  const listFn = useServerFn(listNewsAdmin);
  const upFn = useServerFn(upsertNews);
  const delFn = useServerFn(deleteNews);
  const pubFn = useServerFn(setNewsPublished);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<EducationNewsRow> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const q = useQuery({ queryKey: ["admin","news"], queryFn: () => listFn(), staleTime: 15_000 });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin","news"] });

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      let cover = editing.cover_image_url ?? null;
      if (file) cover = await uploadCover(file);
      await upFn({ data: {
        id: editing.id, title: editing.title || "",
        slug: editing.slug || null, cover_image_url: cover, category: editing.category || null,
        content: editing.content || "", excerpt: editing.excerpt || null,
        publish_date: editing.publish_date || new Date().toISOString(),
        is_published: !!editing.is_published,
      } });
      toast.success("সংরক্ষণ হয়েছে"); setOpen(false); setEditing(null); setFile(null); invalidate();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📰 শিক্ষা সংবাদ ব্যবস্থাপনা</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditing({ is_published: false }); setFile(null); }}><Plus className="mr-2 h-4 w-4" /> নতুন সংবাদ</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? "সংবাদ সম্পাদনা" : "নতুন সংবাদ"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>শিরোনাম *</Label><Input value={editing?.title ?? ""} onChange={(e) => setEditing({ ...editing!, title: e.target.value })} /></div>
              <div><Label>ক্যাটাগরি</Label><Input value={editing?.category ?? ""} onChange={(e) => setEditing({ ...editing!, category: e.target.value })} placeholder="যেমন: বিজ্ঞপ্তি" /></div>
              <div><Label>সারাংশ</Label><Textarea rows={2} value={editing?.excerpt ?? ""} onChange={(e) => setEditing({ ...editing!, excerpt: e.target.value })} /></div>
              <div><Label>বিস্তারিত *</Label><Textarea rows={8} value={editing?.content ?? ""} onChange={(e) => setEditing({ ...editing!, content: e.target.value })} /></div>
              <div>
                <Label>কভার ছবি</Label>
                <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  {file ? file.name : editing?.cover_image_url ? "নতুন ছবি বেছে নিন (বর্তমান আছে)" : "ছবি বাছুন"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pub" checked={!!editing?.is_published} onChange={(e) => setEditing({ ...editing!, is_published: e.target.checked })} />
                <Label htmlFor="pub">প্রকাশ করুন</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
              <Button onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} সংরক্ষণ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {q.isLoading ? <div className="grid gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> :
        (q.data ?? []).length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">কোনো সংবাদ নেই।</Card> :
        <div className="grid gap-3">
          {(q.data ?? []).map((n) => (
            <Card key={n.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-1 gap-3">
                  {n.cover_image_url && <EducationImage path={n.cover_image_url} alt={n.title} className="h-16 w-24 rounded object-cover" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><h3 className="font-semibold">{n.title}</h3>{n.is_published ? <Badge className="bg-secondary text-secondary-foreground">প্রকাশিত</Badge> : <Badge variant="outline">খসড়া</Badge>}</div>
                    <p className="text-xs text-muted-foreground">{n.category ?? ""} · {formatBanglaDate(n.publish_date)}</p>
                    {n.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { try { await pubFn({ data: { id: n.id, is_published: !n.is_published } }); toast.success("আপডেট হয়েছে"); invalidate(); } catch (e) { toast.error((e as Error).message); } }}>{n.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(n); setFile(null); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={async () => { if (!confirm("মুছবেন?")) return; try { await delFn({ data: { id: n.id } }); toast.success("মুছে ফেলা হয়েছে"); invalidate(); } catch (e) { toast.error((e as Error).message); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
