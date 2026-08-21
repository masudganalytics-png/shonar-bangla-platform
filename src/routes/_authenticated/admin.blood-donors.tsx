import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Trash2, Download, Search, Loader2 } from "lucide-react";
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
import { BLOOD_GROUPS, formatBanglaDate, type DonorRow } from "@/lib/blood-shared";
import { downloadCsv } from "@/lib/download";

export const Route = createFileRoute("/_authenticated/admin/blood-donors")({
  head: () => ({
    meta: [
      { title: "রক্তদাতা ব্যবস্থাপনা — অ্যাডমিন" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBloodDonors,
});

function AdminBloodDonors() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [group, setGroup] = useState<string>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const donorsQ = useQuery({
    queryKey: ["admin-blood-donors", status, group],
    queryFn: async () => {
      let query = supabase
        .from("blood_donors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (status !== "all") query = query.eq("status", status as never);
      if (group !== "all") query = query.eq("blood_group", group as never);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DonorRow[];
    },
    enabled: isAdmin,
  });

  const list = useMemo(() => {
    const rows = donorsQ.data ?? [];
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(n) ||
        (r.phone ?? "").includes(n) ||
        (r.village ?? "").toLowerCase().includes(n),
    );
  }, [donorsQ.data, q]);

  async function updateOne(id: string, patch: Partial<DonorRow>) {
    const { error } = await supabase.from("blood_donors").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("আপডেট হয়েছে");
    qc.invalidateQueries({ queryKey: ["admin-blood-donors"] });
    qc.invalidateQueries({ queryKey: ["blood-banner-stats"] });
  }

  async function deleteOne(id: string) {
    if (!confirm("এই দাতাটি মুছে ফেলবেন?")) return;
    const { error } = await supabase.from("blood_donors").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("মুছে ফেলা হয়েছে");
    qc.invalidateQueries({ queryKey: ["admin-blood-donors"] });
  }

  async function bulkAction(action: "approve" | "reject" | "delete") {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`${ids.length}টি রেকর্ড মুছবেন?`)) return;
    if (action === "delete") {
      const { error } = await supabase.from("blood_donors").delete().in("id", ids);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("blood_donors")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .in("id", ids);
      if (error) return toast.error(error.message);
    }
    toast.success("সম্পন্ন হয়েছে");
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-blood-donors"] });
    qc.invalidateQueries({ queryKey: ["blood-banner-stats"] });
  }

  function exportCsv() {
    const rows = list;
    const header = [
      "নাম",
      "রক্তের গ্রুপ",
      "ফোন",
      "WhatsApp",
      "ইউনিয়ন",
      "গ্রাম",
      "প্রস্তুত",
      "স্ট্যাটাস",
      "শেষ দান",
      "নিবন্ধন",
    ];
    const csv =
      "\ufeff" +
      [header, ...rows.map((r) => [
        r.full_name,
        r.blood_group,
        r.phone,
        r.whatsapp ?? "",
        r.union_name ?? "",
        r.village ?? "",
        r.available ? "হ্যাঁ" : "না",
        r.status,
        r.last_donation_date ?? "",
        r.created_at,
      ])]
        .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    downloadCsv(`blood-donors-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const total = donorsQ.data?.length ?? 0;
  const approved = (donorsQ.data ?? []).filter((r) => r.status === "approved").length;
  const available = (donorsQ.data ?? []).filter(
    (r) => r.status === "approved" && r.available,
  ).length;
  const groupCounts = BLOOD_GROUPS.map((g) => ({
    g,
    n: (donorsQ.data ?? []).filter((r) => r.blood_group === g && r.status === "approved").length,
  }));

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Stat label="মোট দাতা" value={total} />
        <Stat label="অনুমোদিত" value={approved} />
        <Stat label="আজ প্রস্তুত" value={available} />
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">গ্রুপভিত্তিক</div>
            <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
              {groupCounts.map(({ g, n }) => (
                <span key={g} className="rounded bg-red-50 px-1.5 py-0.5 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {g}: {n}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-2 p-3 sm:grid-cols-5">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="নাম, ফোন, গ্রাম…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
              <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
              <SelectItem value="approved">অনুমোদিত</SelectItem>
              <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            </SelectContent>
          </Select>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব গ্রুপ</SelectItem>
              {BLOOD_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" /> CSV
          </Button>
        </CardContent>
      </Card>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-accent p-2">
          <span className="text-sm">{selected.size}টি নির্বাচিত</span>
          <Button size="sm" onClick={() => bulkAction("approve")}>অনুমোদন</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("reject")}>প্রত্যাখ্যান</Button>
          <Button size="sm" variant="destructive" onClick={() => bulkAction("delete")}>মুছুন</Button>
        </div>
      )}

      {donorsQ.isLoading ? (
        <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">কোনো ডেটা নেই</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-2 w-8"></th>
                <th className="p-2">নাম</th>
                <th className="p-2">গ্রুপ</th>
                <th className="p-2">যোগাযোগ</th>
                <th className="p-2">ঠিকানা</th>
                <th className="p-2">স্ট্যাটাস</th>
                <th className="p-2">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {r.photo_url && (
                        <img src={r.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      )}
                      <div>
                        <div className="font-medium">{r.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBanglaDate(r.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                      {r.blood_group}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="text-xs">{r.phone}</div>
                    {r.whatsapp && <div className="text-xs text-muted-foreground">WA: {r.whatsapp}</div>}
                  </td>
                  <td className="p-2 text-xs">
                    {[r.village, r.union_name].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={
                          r.status === "approved"
                            ? "default"
                            : r.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className={r.status === "approved" ? "bg-emerald-600" : ""}
                      >
                        {r.status === "approved" ? "অনুমোদিত" : r.status === "rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমাণ"}
                      </Badge>
                      {r.status === "approved" && (
                        <button
                          onClick={() => updateOne(r.id, { available: !r.available })}
                          className={`text-[11px] underline-offset-2 hover:underline ${r.available ? "text-emerald-700" : "text-muted-foreground"}`}
                        >
                          {r.available ? "প্রস্তুত" : "প্রস্তুত নয়"}
                        </button>
                      )}
                      {r.status === "approved" && (
                        <button
                          onClick={() => updateOne(r.id, { is_active: !r.is_active })}
                          className={`text-[11px] underline-offset-2 hover:underline ${r.is_active ? "text-primary" : "text-destructive"}`}
                        >
                          {r.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      {r.status !== "approved" && (
                        <Button size="sm" onClick={() => updateOne(r.id, { status: "approved" })}>
                          <Check className="h-3 w-3" />
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
