import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Flag, Loader2, Search, ShieldCheck, Trash2 } from "lucide-react";
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
import { GovtPhoto } from "@/components/govt/GovtPhoto";
import { AdminGovtCreateDialog } from "@/components/govt/AdminGovtCreateDialog";
import {
  approveAndVerifyGovtWorker,
  deleteGovtWorker,
  listAllGovtWorkers,
  listGovtReports,
  updateGovtModeration,
  updateGovtReportStatus,
} from "@/lib/govt.functions";
import {
  GOVT_PHONE_VISIBILITY_META,
  GOVT_REPORT_STATUS_META,
  GOVT_STATUS_META,
  type GovtWorkerStatus,
} from "@/lib/govt-shared";

export const Route = createFileRoute("/_authenticated/admin/govt-workers")({
  head: () => ({
    meta: [
      { title: "সরকারি চাকরিজীবী ব্যবস্থাপনা — অ্যাডমিন | KHIJIRION" },
      { name: "description", content: "সরকারি চাকরিজীবী প্রোফাইল অনুমোদন, যাচাই ও রিপোর্ট ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGovtWorkers,
});

function AdminGovtWorkers() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAllGovtWorkers);
  const fetchReports = useServerFn(listGovtReports);
  const moderate = useServerFn(updateGovtModeration);
  const approveVerify = useServerFn(approveAndVerifyGovtWorker);
  const remove = useServerFn(deleteGovtWorker);
  const setReport = useServerFn(updateGovtReportStatus);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | GovtWorkerStatus>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({ queryKey: ["admin", "govt"], queryFn: () => fetchAll({}) });
  const reportsQ = useQuery({ queryKey: ["admin", "govt", "reports"], queryFn: () => fetchReports({}) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "govt"] });
    qc.invalidateQueries({ queryKey: ["govt"] });
  };

  const moderateMut = useMutation({
    mutationFn: (vars: { id: string; status?: GovtWorkerStatus; is_verified?: boolean; admin_note?: string | null }) =>
      moderate({ data: vars }),
    onSuccess: () => { toast.success("হালনাগাদ হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveVerify({ data: { id } }),
    onSuccess: () => { toast.success("অনুমোদন ও যাচাই সম্পন্ন"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const reportMut = useMutation({
    mutationFn: (vars: { id: string; status: "open" | "reviewed" | "dismissed" }) => setReport({ data: vars }),
    onSuccess: () => { toast.success("রিপোর্ট হালনাগাদ হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "govt", "reports"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((w) => {
      if (status !== "all" && w.status !== status) return false;
      if (!needle) return true;
      return [w.full_name, w.designation, w.organization, w.department, w.current_district, w.ukhiya_area, w.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [data, q, status]);

  const pendingCount = (data ?? []).filter((w) => w.status === "pending").length;
  const openReports = (reportsQ.data ?? []).filter((r) => r.status === "open");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="নাম, পদবি, প্রতিষ্ঠান বা নম্বর খুঁজুন…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব অবস্থা</SelectItem>
            <SelectItem value="pending">যাচাই অপেক্ষমাণ</SelectItem>
            <SelectItem value="approved">অনুমোদিত</SelectItem>
            <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            <SelectItem value="hidden">লুকানো</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          মোট {rows.length} টি • অপেক্ষমাণ {pendingCount} টি
        </span>
        <AdminGovtCreateDialog onCreated={invalidate} />
      </div>

      {isLoading ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">কোনো প্রোফাইল পাওয়া যায়নি।</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((w) => (
            <Card key={w.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <GovtPhoto url={w.photo_url} alt={w.full_name} className="h-14 w-14 rounded-xl" />
                <div className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold">{w.full_name}</p>
                    {w.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {w.designation} • {w.organization}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {w.department} • {w.current_district}
                    {w.current_upazila ? ` (${w.current_upazila})` : ""} • {w.ukhiya_area}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {w.phone || "নম্বর নেই"} • {GOVT_PHONE_VISIBILITY_META[w.phone_visibility].label}
                  </p>
                </div>

                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${GOVT_STATUS_META[w.status].className}`}>
                  {GOVT_STATUS_META[w.status].label}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={approveMut.isPending}
                    onClick={() => approveMut.mutate(w.id)}
                  >
                    <ShieldCheck className="mr-1.5 h-4 w-4" />
                    অনুমোদন ও যাচাই
                  </Button>
                  <Select
                    value={w.status}
                    onValueChange={(v) => moderateMut.mutate({ id: w.id, status: v as GovtWorkerStatus })}
                  >
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">যাচাই অপেক্ষমাণ</SelectItem>
                      <SelectItem value="approved">অনুমোদিত</SelectItem>
                      <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
                      <SelectItem value="hidden">লুকানো</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moderateMut.mutate({ id: w.id, is_verified: !w.is_verified })}
                  >
                    {w.is_verified ? "যাচাই বাতিল" : "যাচাই করুন"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>প্রোফাইল স্থায়ীভাবে মুছবেন?</AlertDialogTitle>
                        <AlertDialogDescription>
                          “{w.full_name}” প্রোফাইলটি মুছে ফেলা হলে তা আর ফেরত আনা যাবে না।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(w.id)}>মুছে ফেলুন</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[240px] flex-1">
                  <label className="text-xs text-muted-foreground">অ্যাডমিন নোট (ব্যবহারকারী দেখতে পাবেন)</label>
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={notes[w.id] ?? w.admin_note ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [w.id]: e.target.value }))}
                    placeholder="যেমন: পরিচয়পত্রের তথ্য অসম্পূর্ণ, সংশোধন করে আবার জমা দিন।"
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    moderateMut.mutate({
                      id: w.id,
                      admin_note: (notes[w.id] ?? w.admin_note ?? "").trim() || null,
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

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Flag className="h-4 w-4" />
          রিপোর্ট ({openReports.length} টি নতুন)
        </h2>
        {reportsQ.isLoading ? (
          <Card className="p-6 text-center text-muted-foreground">লোড হচ্ছে…</Card>
        ) : (reportsQ.data ?? []).length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">কোনো রিপোর্ট নেই।</Card>
        ) : (
          <div className="space-y-2">
            {(reportsQ.data ?? []).map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-[200px] flex-1">
                  <p className="font-medium">{r.worker_name ?? "অজানা প্রোফাইল"}</p>
                  <p className="text-sm text-muted-foreground">{r.reason}</p>
                  {r.details && <p className="text-xs text-muted-foreground">{r.details}</p>}
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${GOVT_REPORT_STATUS_META[r.status].className}`}>
                  {GOVT_REPORT_STATUS_META[r.status].label}
                </span>
                <Select value={r.status} onValueChange={(v) => reportMut.mutate({ id: r.id, status: v as "open" | "reviewed" | "dismissed" })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">নতুন</SelectItem>
                    <SelectItem value="reviewed">পর্যালোচিত</SelectItem>
                    <SelectItem value="dismissed">বাতিল</SelectItem>
                  </SelectContent>
                </Select>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
