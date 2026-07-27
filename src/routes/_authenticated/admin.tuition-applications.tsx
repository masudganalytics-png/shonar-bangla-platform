import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { listTuitionApplicationsAdmin, setTuitionApplicationStatus } from "@/lib/education.functions";
import { TUITION_APP_STATUS_LABEL } from "@/lib/education-shared";
import { formatBanglaDate } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/tuition-applications")({
  component: AdminTuitionApps,
});

function AdminTuitionApps() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTuitionApplicationsAdmin);
  const statusFn = useServerFn(setTuitionApplicationStatus);
  const q = useQuery({ queryKey: ["admin","tapps"], queryFn: () => listFn(), staleTime: 15_000 });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin","tapps"] });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">📨 টিউশন আবেদন</h1>
      {q.isLoading ? <div className="grid gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> :
        (q.data ?? []).length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">কোনো আবেদন নেই।</Card> :
        <div className="grid gap-3">
          {(q.data ?? []).map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{TUITION_APP_STATUS_LABEL[a.status]}</Badge>
                    <p className="text-xs text-muted-foreground">{formatBanglaDate(a.created_at)}</p>
                  </div>
                  <p className="mt-1 text-xs font-mono text-muted-foreground">Request: {a.request_id.slice(0,8)} · Tutor: {a.tutor_id.slice(0,8)}</p>
                  {a.message && <p className="mt-1 text-sm">{a.message}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { try { await statusFn({ data: { id: a.id, status: "accepted" } }); toast.success("গৃহীত"); invalidate(); } catch (e) { toast.error((e as Error).message); } }}><CheckCircle2 className="mr-1 h-4 w-4" /> গ্রহণ</Button>
                  <Button size="sm" variant="outline" onClick={async () => { try { await statusFn({ data: { id: a.id, status: "rejected" } }); invalidate(); } catch (e) { toast.error((e as Error).message); } }}><XCircle className="mr-1 h-4 w-4" /> প্রত্যাখ্যান</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
