import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Loader2, Search, Trash2, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  adminListMosques,
  adminSetMosqueStatus,
  adminDeleteMosque,
  adminListMosqueReports,
  adminResolveMosqueReport,
  getMosqueDetail,
} from "@/lib/mosque.functions";
import {
  MOSQUE_STATUS_LABEL_BN,
  mosqueLocationLine,
  mosquePath,
  COMMITTEE_POSITION_LABEL_BN,
  type MosqueRow,
} from "@/lib/mosque-shared";

export const Route = createFileRoute("/_authenticated/admin/mosques")({
  head: () => ({
    meta: [
      { title: "মসজিদ ও সমাজ ব্যবস্থাপনা — অ্যাডমিন" },
      { name: "description", content: "মসজিদ প্রোফাইল যাচাই, সম্পাদনা ও রিপোর্ট ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMosquesPage,
});

const money = (n: number) => `${new Intl.NumberFormat("bn-BD").format(Math.round(n))} ৳`;

function AdminMosquesPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListMosques);
  const setStatus = useServerFn(adminSetMosqueStatus);
  const remove = useServerFn(adminDeleteMosque);
  const listReports = useServerFn(adminListMosqueReports);
  const resolveReport = useServerFn(adminResolveMosqueReport);

  const [status, setStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [detailSlug, setDetailSlug] = useState<string | null>(null);

  const rowsQ = useQuery({
    queryKey: ["admin-mosques", status, q],
    queryFn: (): Promise<MosqueRow[]> => list({ data: { status, q: q || undefined } }),
  });

  const reportsQ = useQuery({ queryKey: ["admin-mosque-reports"], queryFn: () => listReports() });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-mosques"] });
    void qc.invalidateQueries({ queryKey: ["mosques"] });
    void qc.invalidateQueries({ queryKey: ["mosques-recent-home"] });
  };

  const moderate = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "verified" | "rejected" }) => setStatus({ data: v }),
    onSuccess: () => {
      toast.success("অবস্থা হালনাগাদ হয়েছে");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("প্রোফাইল মুছে ফেলা হয়েছে");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resolve = useMutation({
    mutationFn: (v: { id: string; status: "open" | "resolved" }) => resolveReport({ data: v }),
    onSuccess: () => {
      toast.success("রিপোর্ট হালনাগাদ হয়েছে");
      void qc.invalidateQueries({ queryKey: ["admin-mosque-reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = rowsQ.data ?? [];
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="মোট প্রোফাইল" value={String(rows.length)} />
        <StatCard label="যাচাইাধীন" value={String(pendingCount)} />
        <StatCard label="রিপোর্ট" value={String((reportsQ.data ?? []).filter((r) => r.status === "open").length)} />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(term.trim());
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="নাম, এলাকা, ইউনিয়ন, উপজেলা"
              className="pl-9"
            />
          </form>
          <Select value={status} onValueChange={(v) => setStatusFilter(v as typeof status)}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব অবস্থা</SelectItem>
              <SelectItem value="pending">যাচাইাধীন</SelectItem>
              <SelectItem value="verified">যাচাইকৃত</SelectItem>
              <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {rowsQ.isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">কোনো প্রোফাইল পাওয়া যায়নি।</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((m) => (
              <div key={m.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{m.name}</h3>
                      <StatusChip status={m.status} />
                      {m.finance_public ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">আর্থিক হিসাব প্রকাশ্য</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{mosqueLocationLine(m)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ইমাম: {m.imam_name || "—"} · মুয়াজ্জিন: {m.muazzin_name || "—"} · ফোন: {m.phone || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDetailSlug(mosquePath(m))}>
                      <Eye className="mr-1.5 h-4 w-4" /> বিস্তারিত
                    </Button>
                    {m.status !== "verified" ? (
                      <Button
                        size="sm"
                        onClick={() => moderate.mutate({ id: m.id, status: "verified" })}
                        disabled={moderate.isPending}
                      >
                        <BadgeCheck className="mr-1.5 h-4 w-4" /> অনুমোদন
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moderate.mutate({ id: m.id, status: "pending" })}
                        disabled={moderate.isPending}
                      >
                        নিষ্ক্রিয় করুন
                      </Button>
                    )}
                    {m.status !== "rejected" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moderate.mutate({ id: m.id, status: "rejected" })}
                        disabled={moderate.isPending}
                      >
                        <X className="mr-1.5 h-4 w-4" /> প্রত্যাখ্যান
                      </Button>
                    ) : null}
                    {m.status === "verified" ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/community/mosques/$slug" params={{ slug: mosquePath(m) }}>
                          পাবলিক পাতা
                        </Link>
                      </Button>
                    ) : null}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" aria-label="মুছুন">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>প্রোফাইল মুছে ফেলবেন?</AlertDialogTitle>
                          <AlertDialogDescription>
                            “{m.name}” এবং এর কমিটি, সমাজ, দাতা ও আর্থিক তথ্য স্থায়ীভাবে মুছে যাবে।
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>বাতিল</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(m.id)}>মুছে ফেলুন</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reports */}
      <Card className="p-4">
        <h2 className="text-base font-bold">রিপোর্ট</h2>
        {(reportsQ.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">কোনো রিপোর্ট নেই।</p>
        ) : (
          <div className="mt-3 space-y-2">
            {(reportsQ.data ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.mosques?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                    {r.status === "open" ? "নতুন" : "সমাধান হয়েছে"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolve.mutate({ id: r.id, status: r.status === "open" ? "resolved" : "open" })}
                    disabled={resolve.isPending}
                  >
                    {resolve.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {r.status === "open" ? "সমাধান" : "পুনরায় খুলুন"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <MosqueDetailDialog slug={detailSlug} onClose={() => setDetailSlug(null)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}

function StatusChip({ status }: { status: MosqueRow["status"] }) {
  const tone =
    status === "verified"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : status === "rejected"
        ? "bg-destructive/10 text-destructive"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{MOSQUE_STATUS_LABEL_BN[status]}</span>;
}

function MosqueDetailDialog({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const fetchDetail = useServerFn(getMosqueDetail);
  const q = useQuery({
    queryKey: ["admin-mosque-detail", slug],
    queryFn: () => fetchDetail({ data: { slug: slug as string } }),
    enabled: !!slug,
  });

  return (
    <Dialog open={!!slug} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{q.data?.mosque.name ?? "প্রোফাইলের বিস্তারিত"}</DialogTitle>
          <DialogDescription>কমিটি, সমাজ, দাতা ও আর্থিক তথ্য।</DialogDescription>
        </DialogHeader>
        {q.isLoading ? (
          <Skeleton className="h-40" />
        ) : !q.data ? (
          <p className="text-sm text-muted-foreground">
            যাচাই না হওয়া প্রোফাইলের বিস্তারিত পাবলিক ভিউতে দেখা যায় না। অনুমোদনের পর দেখুন।
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold">💰 আয়-ব্যয়</h3>
              {q.data.finance.visible ? (
                <p className="mt-1 text-muted-foreground">
                  আয়: {money(q.data.finance.income)} · ব্যয়: {money(q.data.finance.expense)} · ব্যালেন্স:{" "}
                  {money(q.data.finance.balance)}
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">আর্থিক হিসাব প্রকাশ্য নয়।</p>
              )}
            </section>
            <section>
              <h3 className="font-semibold">👥 কমিটি ({q.data.committee.length})</h3>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {q.data.committee.map((c) => (
                  <li key={c.id}>
                    {c.full_name} — {c.custom_title || COMMITTEE_POSITION_LABEL_BN[c.position]}
                  </li>
                ))}
                {q.data.committee.length === 0 ? <li>তথ্য নেই</li> : null}
              </ul>
            </section>
            <section>
              <h3 className="font-semibold">🤝 সমাজপতি ({q.data.leaders.length}) ও সদস্য ({q.data.members.length})</h3>
              <p className="mt-1 text-muted-foreground">
                {[...q.data.leaders, ...q.data.members].map((p) => p.full_name).join(", ") || "তথ্য নেই"}
              </p>
            </section>
            <section>
              <h3 className="font-semibold">🏗️ প্রকল্প ({q.data.projects.length})</h3>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {q.data.projects.map((p) => (
                  <li key={p.id}>
                    {p.name} — সংগৃহীত {money(Number(p.collected_amount))} / লক্ষ্য {money(Number(p.target_amount))}
                  </li>
                ))}
                {q.data.projects.length === 0 ? <li>তথ্য নেই</li> : null}
              </ul>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
