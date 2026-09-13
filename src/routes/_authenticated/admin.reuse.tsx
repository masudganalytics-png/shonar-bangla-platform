import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Flag, Loader2, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminDeleteReuseListing,
  listAllReuseListings,
  listReuseReports,
  updateReuseModeration,
  updateReuseReportStatus,
} from "@/lib/reuse.functions";
import {
  REUSE_STATUS_META,
  REUSE_TYPE_META,
  toBanglaReuseDigits,
  formatReusePrice,
  type ReuseStatus,
} from "@/lib/reuse-shared";

export const Route = createFileRoute("/_authenticated/admin/reuse")({
  head: () => ({
    meta: [
      { title: "KHIJIRION Reuse ব্যবস্থাপনা — অ্যাডমিন | উখিয়া সেবা" },
      { name: "description", content: "ব্যবহৃত পণ্যের তালিকা অনুমোদন ও মডারেশন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReuse,
});

type StatusFilter = "all" | ReuseStatus;
type TypeFilter = "all" | "sale" | "donation";

function AdminReuse() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAllReuseListings);
  const fetchReports = useServerFn(listReuseReports);
  const moderate = useServerFn(updateReuseModeration);
  const remove = useServerFn(adminDeleteReuseListing);
  const updateReport = useServerFn(updateReuseReportStatus);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [tab, setTab] = useState<"listings" | "reports">("listings");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reuse"],
    queryFn: () => fetchAll({}),
  });
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["admin", "reuse-reports"],
    queryFn: () => fetchReports({}),
    enabled: tab === "reports",
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "reuse"] });
    qc.invalidateQueries({ queryKey: ["admin", "reuse-reports"] });
    qc.invalidateQueries({ queryKey: ["reuse"] });
  };

  const moderateMut = useMutation({
    mutationFn: (vars: { id: string; status: ReuseStatus; admin_note?: string | null }) =>
      moderate({ data: vars }),
    onSuccess: () => { toast.success("হালনাগাদ হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const reportMut = useMutation({
    mutationFn: (vars: { id: string; status: "open" | "reviewed" | "dismissed" }) =>
      updateReport({ data: vars }),
    onSuccess: () => { toast.success("রিপোর্ট হালনাগাদ হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy = moderateMut.isPending || deleteMut.isPending;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (type !== "all" && l.listing_type !== type) return false;
      if (!needle) return true;
      return [l.title, l.location, l.area, l.category, l.phone].filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [data, q, status, type]);

  const openCount = (reports ?? []).filter((r) => r.status === "open").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === "listings" ? "default" : "outline"} size="sm" onClick={() => setTab("listings")}>
          তালিকাসমূহ
        </Button>
        <Button variant={tab === "reports" ? "default" : "outline"} size="sm" onClick={() => setTab("reports")}>
          <Flag className="mr-1 h-4 w-4" /> রিপোর্ট{openCount > 0 ? ` (${toBanglaReuseDigits(openCount)})` : ""}
        </Button>
      </div>

      {tab === "reports" ? (
        reportsLoading ? (
          <Card className="p-10 text-center text-muted-foreground">লোড হচ্ছে…</Card>
        ) : (reports ?? []).length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">কোনো রিপোর্ট নেই।</Card>
        ) : (
          <div className="space-y-3">
            {(reports ?? []).map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[180px] flex-1">
                  <p className="font-semibold">{r.reason}</p>
                  <p className="text-sm text-muted-foreground">
                    তালিকা: {r.listing_title ?? "মুছে ফেলা হয়েছে"}
                  </p>
                  {r.details && <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>}
                </div>
                <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                  {r.status === "open" ? "খোলা" : r.status === "reviewed" ? "পর্যালোচিত" : "বাতিল"}
                </span>
                {r.status === "open" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={reportMut.isPending}
                      onClick={() => reportMut.mutate({ id: r.id, status: "reviewed" })}>পর্যালোচিত</Button>
                    <Button size="sm" variant="ghost" disabled={reportMut.isPending}
                      onClick={() => reportMut.mutate({ id: r.id, status: "dismissed" })}>বাতিল</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, এলাকা বা নম্বর খুঁজুন…" className="pl-9" />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব অবস্থা</SelectItem>
                {Object.entries(REUSE_STATUS_META).map(([k, m]) => (
                  <SelectItem key={k} value={k}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => setType(v as TypeFilter)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ধরন</SelectItem>
                <SelectItem value="sale">বিক্রয়</SelectItem>
                <SelectItem value="donation">দান</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{toBanglaReuseDigits(rows.length)} টি</span>
          </div>

          {isLoading ? (
            <Card className="p-10 text-center text-muted-foreground">লোড হচ্ছে…</Card>
          ) : rows.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">কোনো তালিকা পাওয়া যায়নি।</Card>
          ) : (
            <div className="space-y-3">
              {rows.map((l) => (
                <Card key={l.id} className="flex flex-wrap items-center gap-4 p-4">
                  {l.image_url && (
                    <img src={l.image_url} alt={l.title} className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
                  )}
                  <div className="min-w-[180px] flex-1">
                    <Link to="/services/reuse/$listingId" params={{ listingId: l.id }}
                      className="font-semibold hover:text-primary hover:underline">
                      {l.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {l.category} • {l.condition} • {formatReusePrice(l.listing_type, l.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.location}{l.area ? ` • ${l.area}` : ""}{l.phone ? ` • ${l.phone}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${REUSE_TYPE_META[l.listing_type].className}`}>
                    {REUSE_TYPE_META[l.listing_type].label}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${REUSE_STATUS_META[l.status].className}`}>
                    {REUSE_STATUS_META[l.status].label}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {l.status === "pending" && (
                      <>
                        <Button size="sm" disabled={busy}
                          onClick={() => moderateMut.mutate({ id: l.id, status: "approved" })}>অনুমোদন</Button>
                        <Button size="sm" variant="destructive" disabled={busy}
                          onClick={() => moderateMut.mutate({ id: l.id, status: "rejected" })}>প্রত্যাখ্যান</Button>
                      </>
                    )}
                    {l.status === "approved" && (
                      <>
                        <Button size="sm" variant="outline" disabled={busy}
                          onClick={() => moderateMut.mutate({ id: l.id, status: "sold" })}>বিক্রি হয়েছে</Button>
                        <Button size="sm" variant="outline" disabled={busy}
                          onClick={() => moderateMut.mutate({ id: l.id, status: "donated" })}>দান হয়েছে</Button>
                        <Button size="sm" variant="outline" disabled={busy}
                          onClick={() => moderateMut.mutate({ id: l.id, status: "hidden" })}>লুকান</Button>
                      </>
                    )}
                    {(l.status === "hidden" || l.status === "rejected" || l.status === "sold" || l.status === "donated") && (
                      <Button size="sm" variant="outline" disabled={busy}
                        onClick={() => moderateMut.mutate({ id: l.id, status: "approved" })}>পুনরুদ্ধার</Button>
                    )}
                    <Button size="sm" variant="ghost" disabled={busy}
                      onClick={() => { if (window.confirm("এই তালিকাটি মুছে ফেলবেন?")) deleteMut.mutate(l.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
