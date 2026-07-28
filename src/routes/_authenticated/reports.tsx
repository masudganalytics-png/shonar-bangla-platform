import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ImageIcon, Loader2, MessageSquarePlus, RefreshCw, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { COMPLAINT_REASONS, reasonLabel, statusLabel, statusTone } from "@/lib/complaints-constants";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "অভিযোগ — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "বিদ্যুৎ সংক্রান্ত অভিযোগ জমা দিন ও অগ্রগতি দেখুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

type ReportRow = {
  id: string;
  title: string;
  description: string;
  reason: string;
  status: string;
  admin_response: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

function ReportsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const q = useQuery({
    queryKey: ["reports", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, title, description, reason, status, admin_response, image_url, created_at, updated_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  });

  const del = useMutation({
    mutationFn: async (row: ReportRow) => {
      if (row.image_url) {
        const path = extractPath(row.image_url);
        if (path) await supabase.storage.from("complaint-images").remove([path]);
      }
      const { error } = await supabase.from("reports").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("অভিযোগ মুছে ফেলা হয়েছে");
      qc.invalidateQueries({ queryKey: ["reports", "mine"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">অভিযোগ কেন্দ্র</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">আপনার অভিযোগসমূহ</h1>
          <p className="mt-1 text-sm text-muted-foreground">সমস্যা জানান, প্রশাসনের উত্তর পান — সবই এক জায়গায়।</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? <><X className="mr-2 h-4 w-4" /> বন্ধ করুন</> : <><MessageSquarePlus className="mr-2 h-4 w-4" /> নতুন অভিযোগ</>}
        </Button>
      </header>

      {showForm && (
        <ComplaintForm
          onDone={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["reports", "mine"] });
          }}
        />
      )}

      <section className="mt-6 space-y-3">
        {q.isLoading ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">লোড হচ্ছে…</Card>
        ) : q.isError ? (
          <Card className="p-8 text-center text-sm text-destructive">ডেটা লোড করা যায়নি।</Card>
        ) : !q.data?.length ? (
          <Card className="p-10 text-center">
            <MessageSquarePlus className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 font-medium">এখনও কোনো অভিযোগ নেই</p>
            <p className="mt-1 text-sm text-muted-foreground">উপরের বাটন থেকে প্রথম অভিযোগটি জমা দিন।</p>
          </Card>
        ) : (
          q.data.map((r) => <ReportItem key={r.id} row={r} onDelete={() => del.mutate(r)} />)
        )}
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        <AlertTriangle className="mr-1 inline h-3 w-3" />
        একই বিষয়ে বারবার অভিযোগ পাঠাবেন না — সিস্টেম ২৪ ঘণ্টায় একই শিরোনামের ডুপ্লিকেট ব্লক করে।
      </p>
    </div>
  );
}

/* ------------------------------- Report Item ------------------------------ */

function ReportItem({ row, onDelete }: { row: ReportRow; onDelete: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!row.image_url) return;
    const path = extractPath(row.image_url);
    if (!path) return;
    supabase.storage.from("complaint-images").createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl) setSignedUrl(data.signedUrl);
    });
  }, [row.image_url]);

  const tone = statusTone(row.status);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{row.title}</h3>
            <Badge variant="outline" className="text-xs">{reasonLabel(row.reason)}</Badge>
            <Badge className={toneClass(tone)}>{statusLabel(row.status)}</Badge>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{row.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">জমা: {formatBanglaDate(row.created_at)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="মুছুন">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {signedUrl && (
        <a href={signedUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block">
          <img src={signedUrl} alt="অভিযোগের ছবি" className="max-h-48 rounded-md border" />
        </a>
      )}

      {row.admin_response && (
        <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-primary">প্রশাসনের উত্তর</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{row.admin_response}</p>
        </div>
      )}
    </Card>
  );
}

function toneClass(tone: string) {
  switch (tone) {
    case "primary": return "bg-primary text-primary-foreground";
    case "secondary": return "bg-secondary text-secondary-foreground";
    case "warning": return "bg-warning text-warning-foreground";
    case "destructive": return "bg-destructive text-destructive-foreground";
    default: return "";
  }
}

/* ------------------------------- Form ------------------------------------- */

function ComplaintForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>(COMPLAINT_REASONS[0].value);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function submit() {
    if (!user) return;
    const t = title.trim();
    const d = description.trim();
    if (t.length < 4) { toast.error("শিরোনাম অন্তত ৪ অক্ষর হতে হবে"); return; }
    if (d.length < 10) { toast.error("বিবরণ অন্তত ১০ অক্ষর হতে হবে"); return; }
    if (t.length > 120) { toast.error("শিরোনাম সর্বোচ্চ ১২০ অক্ষর"); return; }
    if (d.length > 2000) { toast.error("বিবরণ সর্বোচ্চ ২০০০ অক্ষর"); return; }
    if (file && file.size > 5 * 1024 * 1024) { toast.error("ছবি সর্বোচ্চ ৫ MB"); return; }

    setSubmitting(true);
    try {
      // Duplicate detection: same title & reason in last 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: dupes } = await supabase
        .from("reports")
        .select("id")
        .eq("user_id", user.id)
        .eq("reason", reason as never)
        .ilike("title", t)
        .gte("created_at", since)
        .limit(1);
      if (dupes && dupes.length > 0) {
        toast.error("গত ২৪ ঘণ্টায় একই শিরোনামের অভিযোগ ইতিমধ্যে জমা রয়েছে।");
        setSubmitting(false);
        return;
      }

      let image_url: string | null = null;
      if (file) {
        const { uploadImageToCloudinary } = await import("@/lib/cloudinary");
        image_url = await uploadImageToCloudinary(file, `ukhiya-seba/complaints/${user.id}`);
      }

      const { error } = await supabase.from("reports").insert({
        user_id: user.id,
        title: t,
        description: d,
        reason: reason as never,
        category: "billing" as never, // legacy required column
        image_url,
      });
      if (error) throw error;

      toast.success("অভিযোগ জমা হয়েছে");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "জমা দেওয়া যায়নি");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>কারণ</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMPLAINT_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="c-title">শিরোনাম</Label>
          <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="সংক্ষেপে সমস্যা লিখুন" maxLength={120} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="c-desc">বিস্তারিত</Label>
          <Textarea id="c-desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="সমস্যাটি বিস্তারিত ব্যাখ্যা করুন — মিটার নং, তারিখ, পরিমাণ ইত্যাদি উল্লেখ করুন" maxLength={2000} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>ছবি সংযুক্ত করুন (ঐচ্ছিক)</Label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm hover:bg-accent">
              <ImageIcon className="h-4 w-4" />
              <span>{file ? file.name : "ছবি বাছাই করুন"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file && (
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                <RefreshCw className="mr-1 h-3 w-3" /> সরান
              </Button>
            )}
          </div>
          {preview && <img src={preview} alt="প্রিভিউ" className="mt-2 max-h-40 rounded-md border" />}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>বাতিল</Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> জমা হচ্ছে…</> : "জমা দিন"}
        </Button>
      </div>
    </Card>
  );
}

function extractPath(stored: string): string | null {
  // We store the path directly (e.g. "<uid>/123.jpg"). Backwards-compat with full URL.
  if (!stored) return null;
  if (stored.startsWith("http")) {
    const idx = stored.indexOf("/complaint-images/");
    if (idx >= 0) return stored.substring(idx + "/complaint-images/".length);
    return null;
  }
  return stored;
}
