import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, Loader2, Search, Trash2 } from "lucide-react";
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
import { ProbashiPhoto } from "@/components/probashi/ProbashiPhoto";
import { listAllProbashi, updateProbashiModeration, deleteProbashi } from "@/lib/probashi.functions";
import {
  PROBASHI_STATUS_META,
  countryLabel,
  toBanglaDigits,
  type ProbashiStatus,
} from "@/lib/probashi-shared";

export const Route = createFileRoute("/_authenticated/admin/probashi")({
  head: () => ({
    meta: [
      { title: "প্রবাসী কর্নার ব্যবস্থাপনা — অ্যাডমিন | উখিয়া সেবা" },
      { name: "description", content: "প্রবাসী প্রোফাইল অনুমোদন, যাচাই ও ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProbashi,
});

function AdminProbashi() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAllProbashi);
  const moderate = useServerFn(updateProbashiModeration);
  const remove = useServerFn(deleteProbashi);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ProbashiStatus>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "probashi"],
    queryFn: () => fetchAll({}),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "probashi"] });
    qc.invalidateQueries({ queryKey: ["probashi"] });
  };

  const moderateMut = useMutation({
    mutationFn: (vars: { id: string; status?: ProbashiStatus; is_verified?: boolean }) =>
      moderate({ data: vars }),
    onSuccess: () => { toast.success("হালনাগাদ হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!needle) return true;
      return [p.full_name, p.city, p.village, p.country, p.phone].filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [data, q, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, দেশ বা নম্বর খুঁজুন…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব অবস্থা</SelectItem>
            <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
            <SelectItem value="approved">অনুমোদিত</SelectItem>
            <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            <SelectItem value="suspended">স্থগিত</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{toBanglaDigits(rows.length)} টি</span>
      </div>

      {isLoading ? (
        <Card className="p-10 text-center text-muted-foreground">লোড হচ্ছে…</Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">কোনো প্রোফাইল পাওয়া যায়নি।</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <ProbashiPhoto url={p.photo_url} alt={p.full_name} className="h-14 w-14 rounded-xl" />
              <div className="min-w-[180px] flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold">{p.full_name}</p>
                  {p.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {countryLabel(p.country)}{p.city ? ` • ${p.city}` : ""}{p.village ? ` • ${p.village}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.phone || "নম্বর নেই"}{p.show_contact ? "" : " • নম্বর গোপন"}
                </p>
              </div>

              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${PROBASHI_STATUS_META[p.status].className}`}>
                {PROBASHI_STATUS_META[p.status].label}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={p.status}
                  onValueChange={(v) => moderateMut.mutate({ id: p.id, status: v as ProbashiStatus })}
                >
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
                    <SelectItem value="approved">অনুমোদন</SelectItem>
                    <SelectItem value="rejected">প্রত্যাখ্যান</SelectItem>
                    <SelectItem value="suspended">স্থগিত</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant={p.is_verified ? "secondary" : "outline"}
                  onClick={() => moderateMut.mutate({ id: p.id, is_verified: !p.is_verified })}
                >
                  <BadgeCheck className="mr-1.5 h-4 w-4" /> {p.is_verified ? "যাচাই বাতিল" : "যাচাই করুন"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => { if (confirm("এই প্রোফাইলটি মুছে ফেলবেন?")) deleteMut.mutate(p.id); }}
                >
                  {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
