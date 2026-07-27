import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, MessageSquare, Wallet, CircleCheck, BarChart3, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminOverview } from "@/lib/admin.functions";
import { formatBanglaCurrency, toBanglaDigits } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => getAdminOverview(),
    staleTime: 30_000,
  });

  const stats = q.data;
  return (
    <div>
      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : q.isError ? (
        <Card className="p-6 text-sm text-destructive">লোড করা যায়নি: {String((q.error as Error).message)}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat icon={Users} label="মোট ব্যবহারকারী" value={toBanglaDigits(stats!.users)} />
          <Stat icon={FileText} label="মোট বিল" value={toBanglaDigits(stats!.bills)} />
          <Stat icon={MessageSquare} label="খোলা অভিযোগ" value={`${toBanglaDigits(stats!.reports_open)} / ${toBanglaDigits(stats!.reports_total)}`} />
          <Stat icon={Wallet} label="মোট বিলের পরিমাণ" value={formatBanglaCurrency(stats!.amount_total)} />
          <Stat icon={CircleCheck} label="পরিশোধিত পরিমাণ" value={formatBanglaCurrency(stats!.amount_paid)} tone="secondary" />
          <Stat
            icon={Wallet}
            label="অপরিশোধিত পরিমাণ"
            value={formatBanglaCurrency(Math.max(0, stats!.amount_total - stats!.amount_paid))}
            tone="warning"
          />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold">বিশ্লেষণ ড্যাশবোর্ড</p>
              <p className="text-xs text-muted-foreground">গড়, মিডিয়ান, ট্রেন্ড ও ইউনিয়ন তুলনা</p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/compare">বিশ্লেষণ খুলুন</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary/10 p-2 text-secondary"><Download className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold">এক্সপোর্ট</p>
              <p className="text-xs text-muted-foreground">CSV (Excel-সমর্থিত) — ব্যবহারকারী, বিল, অভিযোগ</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/admin/users">ব্যবহারকারী</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/admin/bills">বিল</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/admin/complaints">অভিযোগ</Link></Button>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">🎓 শিক্ষা মডিউল ব্যবস্থাপনা</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4"><p className="mb-2 text-sm font-medium">শিক্ষক</p><Button asChild size="sm" variant="outline"><Link to="/admin/teachers">খুলুন</Link></Button></Card>
          <Card className="p-4"><p className="mb-2 text-sm font-medium">টিউশন রিকোয়েস্ট</p><Button asChild size="sm" variant="outline"><Link to="/admin/tuition-requests">খুলুন</Link></Button></Card>
          <Card className="p-4"><p className="mb-2 text-sm font-medium">টিউশন আবেদন</p><Button asChild size="sm" variant="outline"><Link to="/admin/tuition-applications">খুলুন</Link></Button></Card>
          <Card className="p-4"><p className="mb-2 text-sm font-medium">শিক্ষা সংবাদ</p><Button asChild size="sm" variant="outline"><Link to="/admin/education-news">খুলুন</Link></Button></Card>
          <Card className="p-4"><p className="mb-2 text-sm font-medium">শিক্ষার্থী সাফল্য</p><Button asChild size="sm" variant="outline"><Link to="/admin/achievements">খুলুন</Link></Button></Card>
          <Card className="p-4"><p className="mb-2 text-sm font-medium">শিক্ষা রিসোর্স</p><Button asChild size="sm" variant="outline"><Link to="/admin/study-resources">খুলুন</Link></Button></Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">🏪 স্থানীয় ব্যবসা ব্যবস্থাপনা</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4"><p className="mb-2 text-sm font-medium">ব্যবসা</p><Button asChild size="sm" variant="outline"><Link to="/admin/businesses">খুলুন</Link></Button></Card>
          <Card className="p-4"><p className="mb-2 text-sm font-medium">ক্যাটাগরি</p><Button asChild size="sm" variant="outline"><Link to="/admin/business-categories">খুলুন</Link></Button></Card>
          <Card className="p-4"><p className="mb-2 text-sm font-medium">পর্যালোচনা</p><Button asChild size="sm" variant="outline"><Link to="/admin/business-reviews">খুলুন</Link></Button></Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone = "primary" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: "primary" | "secondary" | "warning" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    warning: "bg-warning/10 text-warning",
  } as const;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
