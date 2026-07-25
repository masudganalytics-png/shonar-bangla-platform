import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LogOut, Plus, Trash2, Wallet, TrendingUp, Calendar, ListChecks } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, CATEGORY_MAP, type ExpenseCategory } from "@/lib/expense-meta";
import { formatBanglaCurrency, formatBanglaDate, toBanglaDigits } from "@/lib/bangla";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface ExpenseRow {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string | null;
  spent_at: string;
  created_at: string;
}

function HomePage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth" });
    }
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, amount, category, note, spent_at, created_at")
        .order("spent_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as ExpenseRow[];
    },
  });

  const summary = useMemo(() => computeSummary(expenses), [expenses]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    toast.success("সাইন আউট সম্পন্ন");
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[image:var(--gradient-primary)] grid place-items-center text-primary-foreground shadow-[var(--shadow-glow)]">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base sm:text-lg font-semibold">খরচের খাতা</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {user?.email}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">সাইন আউট</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">
        <SummaryCards
          monthTotal={summary.monthTotal}
          todayTotal={summary.todayTotal}
          count={summary.monthCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <AddExpenseCard
              onAdded={() => qc.invalidateQueries({ queryKey: ["expenses"] })}
            />
            <CategoryBreakdown byCategory={summary.byCategory} monthTotal={summary.monthTotal} />
          </div>

          <div className="lg:col-span-2">
            <RecentExpenses
              expenses={expenses}
              isLoading={isLoading}
              onDeleted={() => qc.invalidateQueries({ queryKey: ["expenses"] })}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

/* --------------------------------- Summary -------------------------------- */

function computeSummary(rows: ExpenseRow[]) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const todayStr = now.toISOString().slice(0, 10);

  let monthTotal = 0;
  let todayTotal = 0;
  let monthCount = 0;
  const byCategory: Record<ExpenseCategory, number> = {
    food: 0, transport: 0, shopping: 0, bills: 0,
    health: 0, education: 0, entertainment: 0, other: 0,
  };

  for (const r of rows) {
    const d = new Date(r.spent_at);
    if (d.getFullYear() === y && d.getMonth() === m) {
      monthTotal += r.amount;
      monthCount += 1;
      byCategory[r.category] += r.amount;
    }
    if (r.spent_at === todayStr) todayTotal += r.amount;
  }

  return { monthTotal, todayTotal, monthCount, byCategory };
}

function SummaryCards({
  monthTotal, todayTotal, count,
}: { monthTotal: number; todayTotal: number; count: number }) {
  const now = new Date();
  const monthName = formatBanglaDate(now).split(" ").slice(1).join(" ");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        label={`এই মাসে (${monthName.replace(",", "")})`}
        value={formatBanglaCurrency(monthTotal)}
        accent="primary"
      />
      <StatCard
        icon={<Calendar className="w-5 h-5" />}
        label="আজকের খরচ"
        value={formatBanglaCurrency(todayTotal)}
        accent="accent"
      />
      <StatCard
        icon={<ListChecks className="w-5 h-5" />}
        label="এই মাসে মোট এন্ট্রি"
        value={toBanglaDigits(count)}
        accent="muted"
      />
    </div>
  );
}

function StatCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent: "primary" | "accent" | "muted" }) {
  const bg =
    accent === "primary" ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
      : accent === "accent" ? "bg-[image:var(--gradient-warm)] text-accent-foreground"
        : "bg-card text-foreground border";
  return (
    <Card className={`${bg} shadow-[var(--shadow-md)] border-0`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${accent === "muted" ? "text-muted-foreground" : "opacity-90"}`}>
            {label}
          </p>
          <div className={`w-9 h-9 grid place-items-center rounded-lg ${accent === "muted" ? "bg-secondary text-secondary-foreground" : "bg-white/20"}`}>
            {icon}
          </div>
        </div>
        <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Add Expense ------------------------------ */

const expenseSchema = z.object({
  amount: z.number().positive("পরিমাণ শূন্যের বেশি হতে হবে"),
  category: z.enum(["food", "transport", "shopping", "bills", "health", "education", "entertainment", "other"]),
  note: z.string().max(200, "নোট সর্বাধিক ২০০ অক্ষর").optional(),
  spent_at: z.string().min(1, "তারিখ দিন"),
});

function AddExpenseCard({ onAdded }: { onAdded: () => void }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10));

  const addMutation = useMutation({
    mutationFn: async () => {
      const parsed = expenseSchema.safeParse({
        amount: Number(amount),
        category,
        note: note.trim() || undefined,
        spent_at: spentAt,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "তথ্য ভুল");
      }
      const { error } = await supabase.from("expenses").insert({
        user_id: user!.id,
        amount: parsed.data.amount,
        category: parsed.data.category,
        note: parsed.data.note ?? null,
        spent_at: parsed.data.spent_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("খরচ যোগ করা হয়েছে");
      setAmount("");
      setNote("");
      onAdded();
    },
    onError: (err: Error) => {
      toast.error("সংরক্ষণ ব্যর্থ", { description: err.message });
    },
  });

  return (
    <Card className="shadow-[var(--shadow-md)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          নতুন খরচ যোগ করুন
        </CardTitle>
        <CardDescription>আজকের বা যেকোনো দিনের খরচ লিপিবদ্ধ করুন</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            addMutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="amount">পরিমাণ (টাকা)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="যেমন: ২৫০"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>ক্যাটাগরি</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="inline-flex items-center gap-2">
                      <c.icon className="w-4 h-4" />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="spent_at">তারিখ</Label>
            <Input
              id="spent_at"
              type="date"
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">নোট (ঐচ্ছিক)</Label>
            <Textarea
              id="note"
              rows={2}
              maxLength={200}
              placeholder="যেমন: দুপুরের খাবার"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={addMutation.isPending}>
            {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            সংরক্ষণ করুন
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* -------------------------- Category Breakdown ---------------------------- */

function CategoryBreakdown({
  byCategory, monthTotal,
}: { byCategory: Record<ExpenseCategory, number>; monthTotal: number }) {
  const rows = CATEGORIES
    .map((c) => ({ ...c, total: byCategory[c.value] }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="shadow-[var(--shadow-md)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">এই মাসের বিভাগ অনুযায়ী খরচ</CardTitle>
        <CardDescription>কোন খাতে কত খরচ হচ্ছে দেখে নিন</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            এখনো কোনো খরচ যোগ করা হয়নি।
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const pct = monthTotal > 0 ? (r.total / monthTotal) * 100 : 0;
              return (
                <div key={r.value}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <r.icon className={`w-4 h-4 ${r.text}`} />
                      {r.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatBanglaCurrency(r.total)}{" "}
                      <span className="text-xs">
                        ({toBanglaDigits(pct.toFixed(0))}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[image:var(--gradient-primary)] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------- Recent Expenses ----------------------------- */

function RecentExpenses({
  expenses, isLoading, onDeleted,
}: { expenses: ExpenseRow[]; isLoading: boolean; onDeleted: () => void }) {
  const [filter, setFilter] = useState<ExpenseCategory | "all">("all");
  const [pendingDelete, setPendingDelete] = useState<ExpenseRow | null>(null);

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.category === filter);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("খরচ মুছে ফেলা হয়েছে");
      onDeleted();
    },
    onError: (err: Error) => toast.error("মুছে ফেলা ব্যর্থ", { description: err.message }),
  });

  return (
    <Card className="shadow-[var(--shadow-md)]">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-lg">সাম্প্রতিক খরচ</CardTitle>
          <CardDescription>আপনার সর্বশেষ খরচের তালিকা</CardDescription>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as ExpenseCategory | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল ক্যাটাগরি</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={expenses.length > 0} />
        ) : (
          <ul className="divide-y">
            {filtered.map((e) => {
              const meta = CATEGORY_MAP[e.category];
              const Icon = meta.icon;
              return (
                <li key={e.id} className="py-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${meta.chip}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{e.note || meta.label}</p>
                      <Badge variant="secondary" className="text-xs">{meta.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatBanglaDate(e.spent_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums">{formatBanglaCurrency(e.amount)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setPendingDelete(e)}
                    aria-label="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>খরচটি মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই কাজটি ফেরানো যাবে না। খরচের এন্ট্রি স্থায়ীভাবে মুছে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              হ্যাঁ, মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-secondary grid place-items-center mb-3">
        <Wallet className="w-6 h-6 text-secondary-foreground" />
      </div>
      <p className="font-medium">
        {hasAny ? "এই ক্যাটাগরিতে কোনো খরচ নেই" : "এখনো কোনো খরচ যোগ হয়নি"}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        পাশের ফর্ম থেকে আপনার প্রথম খরচ যোগ করুন।
      </p>
    </div>
  );
}
