import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MoreVertical, Pencil, Plus, Search, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { toBanglaDigits, formatBanglaCurrency } from "@/lib/bangla";
import {
  BN_MONTHS_FULL, METER_TYPES, UNIONS, providerLabel, meterTypeLabel, unionLabel,
} from "@/lib/bills-constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type BillRow = Database["public"]["Tables"]["bills"]["Row"];

export const Route = createFileRoute("/_authenticated/bills")({
  head: () => ({
    meta: [
      { title: "বিল ইতিহাস — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "আপনার জমা দেওয়া বিদ্যুৎ বিলের সম্পূর্ণ ইতিহাস দেখুন, সম্পাদনা ও মুছুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillsHistoryPage,
});

function statusBadge(status: BillRow["status"]) {
  const map: Record<BillRow["status"], { label: string; cls: string }> = {
    pending: { label: "বকেয়া", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    paid: { label: "পরিশোধিত", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    overdue: { label: "অতিদেয়", cls: "bg-red-500/15 text-red-600 dark:text-red-400" },
  };
  const s = map[status];
  return <Badge variant="secondary" className={s.cls}>{s.label}</Badge>;
}

function BillsHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState<BillRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<BillRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.id)
      .order("bill_year", { ascending: false, nullsFirst: false })
      .order("bill_month", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("বিল লোড করতে ব্যর্থ");
      setBills([]);
      return;
    }
    setBills(data ?? []);
  };

  useEffect(() => { void load(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!bills) return null;
    const q = query.trim().toLowerCase();
    if (!q) return bills;
    return bills.filter((b) =>
      [b.meter_no, b.village, b.union_name, b.provider]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q)),
    );
  }, [bills, query]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      // remove image if any
      if (pendingDelete.bill_image_url) {
        const marker = "bill-images/";
        const idx = pendingDelete.bill_image_url.indexOf(marker);
        if (idx >= 0) {
          const path = pendingDelete.bill_image_url.slice(idx + marker.length);
          await supabase.storage.from("bill-images").remove([path]);
        }
      }
      const { error } = await supabase.from("bills").delete().eq("id", pendingDelete.id);
      if (error) throw error;
      toast.success("বিল মুছে ফেলা হয়েছে");
      setPendingDelete(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "মুছতে ব্যর্থ");
    } finally {
      setDeleting(false);
    }
  };

  const summary = useMemo(() => {
    if (!bills || bills.length === 0) return null;
    const total = bills.reduce((s, b) => s + Number(b.amount), 0);
    const units = bills.reduce((s, b) => s + Number(b.units_consumed), 0);
    return { total, units, count: bills.length };
  }, [bills]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">বিল ইতিহাস</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              আপনার জমা দেওয়া সকল বিদ্যুৎ বিলের তালিকা।
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/bills/new">
              <Plus className="mr-2 h-4 w-4" /> নতুন বিল
            </Link>
          </Button>
        </div>

        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">মোট বিল</div>
                <div className="mt-1 text-2xl font-bold">{toBanglaDigits(summary.count)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">মোট ইউনিট</div>
                <div className="mt-1 text-2xl font-bold">{toBanglaDigits(summary.units.toFixed(0))}</div>
              </CardContent>
            </Card>
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">মোট খরচ</div>
                <div className="mt-1 text-2xl font-bold text-primary">{formatBanglaCurrency(summary.total)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="মিটার, গ্রাম বা প্রোভাইডার দিয়ে খুঁজুন"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {bills === null ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <Card key={i}><CardContent className="h-24 animate-pulse p-4" /></Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-3">
            {filtered.map((b) => (
              <Card key={b.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="text-base font-semibold">
                        {b.bill_month ? BN_MONTHS_FULL[b.bill_month - 1] : ""} {b.bill_year ? toBanglaDigits(b.bill_year) : ""}
                      </div>
                      {statusBadge(b.status)}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>মিটার: {toBanglaDigits(b.meter_no)}</span>
                      <span>ইউনিট: {toBanglaDigits(Number(b.units_consumed).toFixed(0))}</span>
                      <span>{providerLabel(b.provider)}</span>
                      <span>{meterTypeLabel(b.meter_type)}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {[unionLabel(b.union_name), b.village].filter(Boolean).join(", ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{formatBanglaCurrency(Number(b.amount))}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="অপশন">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate({ to: "/bills/$id/edit", params: { id: b.id } })}>
                        <Pencil className="mr-2 h-4 w-4" /> সম্পাদনা
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPendingDelete(b)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> মুছুন
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold">এখনো কোনো বিল নেই</div>
              <p className="max-w-sm text-sm text-muted-foreground">
                আপনার প্রথম বিদ্যুৎ বিল যোগ করুন। ছবি আপলোড করলে AI স্বয়ংক্রিয়ভাবে তথ্য পূরণ করবে।
              </p>
              <Button asChild className="mt-2">
                <Link to="/bills/new">
                  <Plus className="mr-2 h-4 w-4" /> প্রথম বিল যোগ করুন
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বিল মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই কাজটি বাতিল করা যাবে না। বিলের সকল তথ্য ও সংযুক্ত ছবি স্থায়ীভাবে মুছে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "মুছছে..." : "নিশ্চিত করুন"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
