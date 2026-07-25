import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, X, Trash2, Download, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { listAllBills, updateBillStatus, deleteBillAdmin, exportBillsCsv } from "@/lib/admin.functions";
import { downloadCsv } from "@/lib/download";
import { formatBanglaCurrency, formatBanglaDate, toBanglaDigits } from "@/lib/bangla";
import { providerLabel, unionLabel, BN_MONTHS_FULL } from "@/lib/bills-constants";

export const Route = createFileRoute("/_authenticated/admin/bills")({
  component: AdminBills,
});

function AdminBills() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");
  const updateFn = useServerFn(updateBillStatus);
  const deleteFn = useServerFn(deleteBillAdmin);
  const exportFn = useServerFn(exportBillsCsv);

  const q = useQuery({ queryKey: ["admin", "bills"], queryFn: () => listAllBills(), staleTime: 30_000 });

  const upd = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "paid" | "overdue" }) => updateFn({ data: v }),
    onSuccess: () => { toast.success("স্ট্যাটাস আপডেট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "bills"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("বিল মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "bills"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (q.data ?? []).filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return [b.meter_no, b.user_name, b.union_name, b.provider].some((f) => (f ?? "").toLowerCase().includes(s));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="মিটার / ব্যবহারকারী…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 pl-8" />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "paid", "overdue"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "সব" : f === "pending" ? "অপেক্ষমাণ" : f === "paid" ? "পরিশোধিত" : "বকেয়া"}
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
      ) : (
        <Card className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">ব্যবহারকারী</th>
                <th className="p-3 text-left">মিটার</th>
                <th className="p-3 text-left">প্রোভাইডার</th>
                <th className="p-3 text-left">ইউনিয়ন</th>
                <th className="p-3 text-left">মাস</th>
                <th className="p-3 text-right">ইউনিট</th>
                <th className="p-3 text-right">বিল</th>
                <th className="p-3 text-left">স্ট্যাটাস</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="p-3">{b.user_name || <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-3 font-mono text-xs">{b.meter_no}</td>
                  <td className="p-3">{providerLabel(b.provider)}</td>
                  <td className="p-3">{unionLabel(b.union_name)}</td>
                  <td className="p-3 text-xs">{b.bill_month ? `${BN_MONTHS_FULL[b.bill_month - 1]} ${toBanglaDigits(b.bill_year ?? "")}` : formatBanglaDate(b.billing_month)}</td>
                  <td className="p-3 text-right">{toBanglaDigits(b.units_consumed.toFixed(0))}</td>
                  <td className="p-3 text-right">{formatBanglaCurrency(b.amount)}</td>
                  <td className="p-3">
                    {b.status === "paid" && <Badge className="bg-secondary text-secondary-foreground">পরিশোধিত</Badge>}
                    {b.status === "pending" && <Badge className="bg-warning text-warning-foreground">অপেক্ষমাণ</Badge>}
                    {b.status === "overdue" && <Badge className="bg-destructive text-destructive-foreground">বকেয়া</Badge>}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" disabled={upd.isPending || b.status === "paid"} onClick={() => upd.mutate({ id: b.id, status: "paid" })}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={upd.isPending || b.status === "overdue"} onClick={() => upd.mutate({ id: b.id, status: "overdue" })}>
                        <X className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" disabled={del.isPending} onClick={() => { if (confirm("এই বিলটি মুছে ফেলবেন?")) del.mutate(b.id); }}>
                        {del.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 text-destructive" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">কোনো বিল পাওয়া যায়নি।</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">
        ✓ = পরিশোধিত হিসেবে চিহ্নিত করুন • ✗ = বকেয়া হিসেবে চিহ্নিত করুন • ব্যবহারকারী স্বয়ংক্রিয়ভাবে বিজ্ঞপ্তি পাবেন।
      </p>
    </div>
  );
}
