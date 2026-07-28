import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Trash2, Search, Loader2, CheckCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BLOOD_GROUPS, formatBanglaDate, type BloodRequestRow } from "@/lib/blood-shared";

export const Route = createFileRoute("/_authenticated/admin/blood-requests")({
  head: () => ({
    meta: [
      { title: "রক্তের অনুরোধ ব্যবস্থাপনা — অ্যাডমিন" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBloodRequests,
});

function AdminBloodRequests() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [group, setGroup] = useState<string>("all");
  const [q, setQ] = useState("");

  const reqsQ = useQuery({
    queryKey: ["admin-blood-requests", status, group],
    queryFn: async () => {
      let query = supabase
        .from("blood_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (status !== "all") query = query.eq("status", status);
      if (group !== "all") query = query.eq("blood_group", group);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as BloodRequestRow[];
    },
    enabled: isAdmin,
  });

  const list = useMemo(() => {
    const rows = reqsQ.data ?? [];
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter(
      (r) =>
        r.patient_name.toLowerCase().includes(n) ||
        r.hospital_name.toLowerCase().includes(n) ||
        r.phone.includes(n),
    );
  }, [reqsQ.data, q]);

  async function updateOne(id: string, patch: Partial<BloodRequestRow>) {
    const { error } = await supabase.from("blood_requests").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("আপডেট হয়েছে");
    qc.invalidateQueries({ queryKey: ["admin-blood-requests"] });
    qc.invalidateQueries({ queryKey: ["blood-banner-stats"] });
    qc.invalidateQueries({ queryKey: ["blood-requests-approved"] });
  }
  async function deleteOne(id: string) {
    if (!confirm("এই অনুরোধটি মুছে ফেলবেন?")) return;
    const { error } = await supabase.from("blood_requests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("মুছে ফেলা হয়েছে");
    qc.invalidateQueries({ queryKey: ["admin-blood-requests"] });
  }

  const total = reqsQ.data?.length ?? 0;
  const pending = (reqsQ.data ?? []).filter((r) => r.status === "pending").length;
  const approved = (reqsQ.data ?? []).filter((r) => r.status === "approved").length;
  const fulfilled = (reqsQ.data ?? []).filter((r) => r.status === "fulfilled").length;

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Stat label="মোট অনুরোধ" value={total} />
        <Stat label="অপেক্ষমাণ" value={pending} />
        <Stat label="অনুমোদিত" value={approved} />
        <Stat label="পূরণ হয়েছে" value={fulfilled} />
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-2 p-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="রোগী, হাসপাতাল, ফোন…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
              <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
              <SelectItem value="approved">অনুমোদিত</SelectItem>
              <SelectItem value="fulfilled">পূরণ হয়েছে</SelectItem>
              <SelectItem value="closed">বন্ধ</SelectItem>
              <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            </SelectContent>
          </Select>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব গ্রুপ</SelectItem>
              {BLOOD_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {reqsQ.isLoading ? (
        <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">কোনো অনুরোধ নেই</p>
      ) : (
        <div className="grid gap-3">
          {list.map((r) => (
            <Card key={r.id}>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.patient_name}</h3>
                    <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                      {r.blood_group}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.bags_needed} ব্যাগ · {r.hospital_name}
                    </span>
                    <Badge
                      variant={r.status === "pending" ? "secondary" : "default"}
                      className={
                        r.status === "approved" ? "bg-emerald-600" :
                        r.status === "fulfilled" ? "bg-blue-600" :
                        r.status === "rejected" ? "bg-destructive" : ""
                      }
                    >
                      {r.status === "pending" ? "অপেক্ষমাণ" :
                       r.status === "approved" ? "অনুমোদিত" :
                       r.status === "fulfilled" ? "পূরণ হয়েছে" :
                       r.status === "closed" ? "বন্ধ" : "প্রত্যাখ্যাত"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatBanglaDate(r.required_date)}
                    {r.required_time ? ` · ${r.required_time}` : ""}
                    {r.hospital_location ? ` · ${r.hospital_location}` : ""}
                  </div>
                  <div className="mt-1 text-xs">
                    যোগাযোগ: {r.contact_person} · {r.phone}
                    {r.whatsapp ? ` · WA: ${r.whatsapp}` : ""}
                  </div>
                  {r.notes && <p className="mt-1 text-xs text-muted-foreground">{r.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.status !== "approved" && (
                    <Button size="sm" onClick={() => updateOne(r.id, { status: "approved" })}>
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  {r.status !== "fulfilled" && (
                    <Button size="sm" variant="outline" onClick={() => updateOne(r.id, { status: "fulfilled" })}>
                      <CheckCheck className="h-3 w-3" />
                    </Button>
                  )}
                  {r.status !== "closed" && (
                    <Button size="sm" variant="outline" onClick={() => updateOne(r.id, { status: "closed" })}>
                      <Lock className="h-3 w-3" />
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => updateOne(r.id, { status: "rejected" })}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => deleteOne(r.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-bold">{value.toLocaleString("bn-BD")}</div>
      </CardContent>
    </Card>
  );
}
