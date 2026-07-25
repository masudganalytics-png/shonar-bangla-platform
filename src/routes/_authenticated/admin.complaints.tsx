import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, MessageSquare, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { listAllReports, updateReport, exportReportsCsv, type AdminReport } from "@/lib/admin.functions";
import { downloadCsv } from "@/lib/download";
import { COMPLAINT_STATUS, reasonLabel, statusLabel } from "@/lib/complaints-constants";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/complaints")({
  component: AdminComplaints;
});

function AdminComplaints() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "rejected">("all");
  const updFn = useServerFn(updateReport);
  const exportFn = useServerFn(exportReportsCsv);

  const q = useQuery({ queryKey: ["admin", "reports"], queryFn: () => listAllReports(), staleTime: 30_000 });

  const rows = (q.data ?? []).filter((r) => filter === "all" || r.status === filter);

  const mut = useMutation({
    mutationFn: (v: { id: string; status: AdminReport["status"]; admin_response: string | null }) => updFn({ data: v }),
    onSuccess: () => { toast.success("আপডেট হয়েছে — ব্যবহারকারীকে বিজ্ঞপ্তি পাঠানো হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "reports"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(["all", "open", "in_progress", "resolved", "rejected"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "সব" : statusLabel(f)}
            </Button>
          ))}
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={async () => {
            const r = await exportFn();
            downloadCsv(r.filename, r.content);
          }}>
            <Download className="mr-2 h-4 w-4" /> CSV এক্সপোর্ট
          </Button>
        </div>
      </div>

      {q.isLoading ? <Skeleton className="h-72 w-full" /> : q.isError ? (
        <Card className="p-6 text-sm text-destructive">লোড করা যায়নি।</Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">কোনো অভিযোগ নেই।</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <ComplaintRow key={r.id} row={r} onSubmit={(status, resp) => mut.mutate({ id: r.id, status, admin_response: resp || null })} pending={mut.isPending} />
          ))}
        </div>
      )}
    </div>
  );
}

function ComplaintRow({ row, onSubmit, pending }: { row: AdminReport; onSubmit: (s: AdminReport["status"], r: string) => void; pending: boolean }) {
  const [status, setStatus] = useState<AdminReport["status"]>(row.status);
  const [resp, setResp] = useState<string>(row.admin_response ?? "");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{row.title}</h3>
            <Badge variant="outline">{reasonLabel(row.reason)}</Badge>
            <Badge>{statusLabel(row.status)}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.user_name || "নাম নেই"} • জমা: {formatBanglaDate(row.created_at)}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm">{row.description}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr_auto]">
        <Select value={status} onValueChange={(v) => setStatus(v as AdminReport["status"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {COMPLAINT_STATUS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea rows={2} placeholder="প্রশাসনের উত্তর (ব্যবহারকারী বিজ্ঞপ্তি পাবেন)" value={resp} onChange={(e) => setResp(e.target.value)} maxLength={2000} />
        <Button disabled={pending} onClick={() => onSubmit(status, resp)}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          পাঠান
        </Button>
      </div>
    </Card>
  );
}
