import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Phone, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listMaterialOrders,
  updateMaterialOrderStatus,
  type MaterialOrderStatus,
} from "@/lib/ukhiya-go-admin.functions";
import { formatBanglaDate, toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/ukhiya-go/material-orders")({
  head: () => ({
    meta: [
      { title: "নির্মাণ সামগ্রী অর্ডার — অ্যাডমিন | KHIJIRION" },
      { name: "description", content: "নির্মাণ সামগ্রী অর্ডার তালিকা ও স্ট্যাটাস ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMaterialOrders,
});

const STATUS_META: Record<MaterialOrderStatus, string> = {
  pending: "অপেক্ষমাণ",
  confirmed: "নিশ্চিত",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
};

const STATUS_TABS: { value: "all" | MaterialOrderStatus; label: string }[] = [
  { value: "pending", label: "অপেক্ষমাণ" },
  { value: "confirmed", label: "নিশ্চিত" },
  { value: "delivered", label: "ডেলিভারি সম্পন্ন" },
  { value: "cancelled", label: "বাতিল" },
  { value: "all", label: "সব" },
];

function statusBadge(s: string) {
  const label = STATUS_META[s as MaterialOrderStatus] ?? s;
  if (s === "confirmed" || s === "delivered") return <Badge className="bg-primary text-primary-foreground">{label}</Badge>;
  if (s === "cancelled") return <Badge variant="destructive">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}

function AdminMaterialOrders() {
  const qc = useQueryClient();
  const list = useServerFn(listMaterialOrders);
  const [tab, setTab] = useState<"all" | MaterialOrderStatus>("pending");
  const [query, setQuery] = useState("");

  const q = useQuery({ queryKey: ["admin", "material-orders"], queryFn: () => list(), staleTime: 15_000 });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: MaterialOrderStatus }) =>
      updateMaterialOrderStatus({ data: vars }),
    onSuccess: () => {
      toast.success("স্ট্যাটাস আপডেট হয়েছে");
      void qc.invalidateQueries({ queryKey: ["admin", "material-orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "আপডেট করা যায়নি"),
  });

  const rows = useMemo(() => {
    let out = q.data ?? [];
    if (tab !== "all") out = out.filter((o) => o.status === tab);
    const s = query.trim().toLowerCase();
    if (s) {
      out = out.filter(
        (o) =>
          (o.customer_name ?? "").toLowerCase().includes(s) ||
          (o.phone ?? "").includes(s) ||
          (o.delivery_location ?? "").toLowerCase().includes(s) ||
          (o.material ?? "").toLowerCase().includes(s),
      );
    }
    return out;
  }, [q.data, tab, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={
              tab === t.value
                ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            }
          >
            {t.label}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম / মোবাইল / লোকেশন খুঁজুন"
            className="pl-9"
          />
        </div>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : q.isError ? (
        <Card className="p-6 text-sm text-destructive">লোড করা যায়নি: {String((q.error as Error).message)}</Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">কোনো অর্ডার পাওয়া যায়নি।</Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>সামগ্রী</TableHead>
                <TableHead>পরিমাণ</TableHead>
                <TableHead>লোকেশন</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead>মোবাইল</TableHead>
                <TableHead>নোট</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead>অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.material}</TableCell>
                  <TableCell>{o.quantity}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{o.delivery_location}</TableCell>
                  <TableCell>{o.customer_name}</TableCell>
                  <TableCell>
                    <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Phone className="h-3.5 w-3.5" />
                      {toBanglaDigits(o.phone)}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-muted-foreground">{o.notes ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatBanglaDate(o.created_at)}</TableCell>
                  <TableCell>{statusBadge(o.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={o.status}
                      onValueChange={(v) => mut.mutate({ id: o.id, status: v as MaterialOrderStatus })}
                      disabled={mut.isPending}
                    >
                      <SelectTrigger className="w-36">
                        {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_META) as MaterialOrderStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_META[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
