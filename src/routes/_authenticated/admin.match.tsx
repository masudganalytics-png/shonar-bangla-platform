import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Loader2, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  deleteMatchRequest,
  listAllMatchRequests,
  updateMatchModeration,
} from "@/lib/match.functions";
import {
  CREATED_FOR_LABEL,
  LOOKING_FOR_LABEL,
  MARITAL_LABEL,
  MATCH_STATUS_META,
  type MatchRequestStatus,
} from "@/lib/match-shared";

export const Route = createFileRoute("/_authenticated/admin/match")({
  head: () => ({
    meta: [
      { title: "KHIJIRION Match যাচাই — অ্যাডমিন | KHIJIRION" },
      { name: "description", content: "ম্যাচ রিকোয়েস্ট অনুমোদন, যাচাই ও ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMatch,
});

function AdminMatch() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAllMatchRequests);
  const moderate = useServerFn(updateMatchModeration);
  const remove = useServerFn(deleteMatchRequest);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | MatchRequestStatus>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({ queryKey: ["admin", "match"], queryFn: () => fetchAll({}) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "match"] });
    qc.invalidateQueries({ queryKey: ["match"] });
  };

  const moderateMut = useMutation({
    mutationFn: (vars: {
      id: string;
      status?: MatchRequestStatus;
      is_verified?: boolean;
      admin_note?: string | null;
    }) => moderate({ data: vars }),
    onSuccess: () => {
      toast.success("হালনাগাদ হয়েছে");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!needle) return true;
      return [r.display_name, r.area, r.education, r.profession, r.contact_name, r.contact_phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [data, q, status]);

  const pendingCount = (data ?? []).filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="নাম, এলাকা, পেশা বা নম্বর খুঁজুন…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব অবস্থা</SelectItem>
            <SelectItem value="pending">যাচাই অপেক্ষমাণ</SelectItem>
            <SelectItem value="approved">প্রকাশিত</SelectItem>
            <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            <SelectItem value="hidden">লুকানো</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          মোট {rows.length} টি • অপেক্ষমাণ {pendingCount} টি
        </span>
      </div>

      {isLoading ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">কোনো রিকোয়েস্ট পাওয়া যায়নি।</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-4">
                {r.photo_url ? (
                  <img
                    src={r.photo_url}
                    alt={r.display_name}
                    loading="lazy"
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                    ছবি নেই
                  </div>
                )}

                <div className="min-w-[220px] flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold">{r.display_name}</p>
                    {r.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {LOOKING_FOR_LABEL[r.looking_for]} খুঁজছেন • {CREATED_FOR_LABEL[r.created_for]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.area} • {r.age_min}–{r.age_max} বছর • {MARITAL_LABEL[r.marital_status]}
                    {r.education ? ` • ${r.education}` : ""}
                    {r.profession ? ` • ${r.profession}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    যোগাযোগ: {r.contact_name || "নাম নেই"} — {r.contact_phone}
                  </p>
                </div>

                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${MATCH_STATUS_META[r.status].className}`}>
                  {MATCH_STATUS_META[r.status].label}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={moderateMut.isPending}
                    onClick={() => moderateMut.mutate({ id: r.id, status: "approved", is_verified: true })}
                  >
                    <ShieldCheck className="mr-1.5 h-4 w-4" />
                    অনুমোদন ও যাচাই
                  </Button>
                  <Select
                    value={r.status}
                    onValueChange={(v) => moderateMut.mutate({ id: r.id, status: v as MatchRequestStatus })}
                  >
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">যাচাই অপেক্ষমাণ</SelectItem>
                      <SelectItem value="approved">প্রকাশিত</SelectItem>
                      <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
                      <SelectItem value="hidden">লুকানো</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moderateMut.mutate({ id: r.id, is_verified: !r.is_verified })}
                  >
                    {r.is_verified ? "যাচাই বাতিল" : "যাচাই করুন"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>রিকোয়েস্টটি স্থায়ীভাবে মুছবেন?</AlertDialogTitle>
                        <AlertDialogDescription>
                          “{r.display_name}” রিকোয়েস্টটি মুছে ফেলা হলে তা আর ফেরত আনা যাবে না।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(r.id)}>মুছে ফেলুন</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {(r.family_info || r.expectations) && (
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {r.family_info && <p><span className="font-medium text-foreground">পারিবারিক তথ্য:</span> {r.family_info}</p>}
                  {r.expectations && <p><span className="font-medium text-foreground">প্রত্যাশা:</span> {r.expectations}</p>}
                </div>
              )}

              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[240px] flex-1">
                  <label className="text-xs text-muted-foreground">অ্যাডমিন নোট (ব্যবহারকারী দেখতে পাবেন)</label>
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={notes[r.id] ?? r.admin_note ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="যেমন: তথ্য অসম্পূর্ণ, সংশোধন করে আবার জমা দিন।"
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    moderateMut.mutate({
                      id: r.id,
                      admin_note: (notes[r.id] ?? r.admin_note ?? "").trim() || null,
                    })
                  }
                >
                  নোট সংরক্ষণ
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
