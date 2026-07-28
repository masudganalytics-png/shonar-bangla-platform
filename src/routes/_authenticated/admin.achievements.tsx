import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, Trophy, Loader2 } from "lucide-react";
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
import { listAchievementsAdmin, upsertAchievement, deleteAchievement, setAchievementPublished } from "@/lib/education.functions";
import type { AchievementRow } from "@/lib/education-shared";
import { EducationImage } from "@/components/teachers/EducationImage";

export const Route = createFileRoute("/_authenticated/admin/achievements")({
  component: AdminAchievements,
});

async function uploadPhoto(file: File): Promise<string> {
  return uploadImageToCloudinary(file, "ukhiya-seba/achievements");
}

function AdminAchievements() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAchievementsAdmin);
  const upFn = useServerFn(upsertAchievement);
  const delFn = useServerFn(deleteAchievement);
  const pubFn = useServerFn(setAchievementPublished);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AchievementRow> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["admin","ach"], queryFn: () => listFn(), staleTime: 15_000 });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin","ach"] });

  async function save() {
    if (!editing) return; setBusy(true);
    try {
      let photo = editing.photo_url ?? null;
      if (file) photo = await uploadPhoto(file);
      await upFn({ data: {
        id: editing.id, student_name: editing.student_name || "",
        photo_url: photo, institution: editing.institution || null, area: editing.area || null,
        achievement: editing.achievement || "", story: editing.story || null,
        is_published: !!editing.is_published,
      } });
      toast.success("সংরক্ষণ হয়েছে"); setOpen(false); setEditing(null); setFile(null); invalidate();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏆 শিক্ষার্থীদের সাফল্য</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditing({ is_published: false }); setFile(null); }}><Plus className="mr-2 h-4 w-4" /> নতুন সাফল্য</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? "সম্পাদনা" : "নতুন সাফল্য"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>ছাত্র/ছাত্রীর নাম *</Label><Input value={editing?.student_name ?? ""} onChange={(e) => setEditing({ ...editing!, student_name: e.target.value })} /></div>
              <div><Label>অর্জন *</Label><Input value={editing?.achievement ?? ""} onChange={(e) => setEditing({ ...editing!, achievement: e.target.value })} placeholder="যেমন: জাতীয় গণিত অলিম্পিয়াডে ১ম" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>প্রতিষ্ঠান</Label><Input value={editing?.institution ?? ""} onChange={(e) => setEditing({ ...editing!, institution: e.target.value })} /></div>
                <div><Label>এলাকা</Label><Input value={editing?.area ?? ""} onChange={(e) => setEditing({ ...editing!, area: e.target.value })} /></div>
              </div>
              <div><Label>গল্প / বিস্তারিত</Label><Textarea rows={5} value={editing?.story ?? ""} onChange={(e) => setEditing({ ...editing!, story: e.target.value })} /></div>
              <div>
                <Label>ছবি</Label>
                <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-accent">
                  <Upload className="h-4 w-4" />{file ? file.name : editing?.photo_url ? "নতুন ছবি" : "ছবি বাছুন"}
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
        (q.data ?? []).length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground"><Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" /> কোনো সাফল্য নেই।</Card> :
        <div className="grid gap-3">
          {(q.data ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-1 gap-3">
                  {a.photo_url && <EducationImage path={a.photo_url} alt={a.student_name} className="h-16 w-16 rounded object-cover" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><h3 className="font-semibold">{a.student_name}</h3>{a.is_published ? <Badge className="bg-secondary text-secondary-foreground">প্রকাশিত</Badge> : <Badge variant="outline">খসড়া</Badge>}</div>
                    <p className="text-sm text-primary">{a.achievement}</p>
                    <p className="text-xs text-muted-foreground">{[a.institution, a.area].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { try { await pubFn({ data: { id: a.id, is_published: !a.is_published } }); invalidate(); } catch (e) { toast.error((e as Error).message); } }}>{a.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(a); setFile(null); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={async () => { if (!confirm("মুছবেন?")) return; try { await delFn({ data: { id: a.id } }); invalidate(); } catch (e) { toast.error((e as Error).message); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
