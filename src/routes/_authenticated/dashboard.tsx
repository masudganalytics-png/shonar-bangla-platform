import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Bell, MessageSquare, BarChart3, TrendingUp, Wallet, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toBanglaDigits, formatBanglaCurrency } from "@/lib/bangla";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "ড্যাশবোর্ড — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "আপনার বিদ্যুৎ বিলের সারাংশ, বকেয়া ও পরিসংখ্যান।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const QUICK = [
  { to: "/bills", icon: FileText, label: "বিল জমা দিন", color: "from-primary to-primary-glow" },
  { to: "/compare", icon: BarChart3, label: "তুলনা দেখুন", color: "from-secondary to-secondary" },
  { to: "/reports", icon: MessageSquare, label: "অভিযোগ পাঠান", color: "from-warning to-accent" },
  { to: "/notices", icon: Bell, label: "নোটিশ পড়ুন", color: "from-primary-glow to-secondary" },
];

function Dashboard() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "গ্রাহক";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">স্বাগতম</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{name}</h1>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard icon={Wallet} label="চলতি মাসের বিল" value={formatBanglaCurrency(0)} hint="এখনও প্রকাশিত হয়নি" />
        <SummaryCard icon={Clock} label="বকেয়া" value={formatBanglaCurrency(0)} hint={`${toBanglaDigits(0)}টি অপরিশোধিত`} />
        <SummaryCard icon={TrendingUp} label="গত মাসের ব্যবহার" value={`${toBanglaDigits(0)} ইউনিট`} hint="তথ্য প্রক্রিয়াধীন" />
      </div>

      {/* Quick actions */}
      <h2 className="mt-10 text-lg font-semibold">দ্রুত ক্রিয়া</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to} className="group">
            <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
              <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${color} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-medium">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      <Card className="mt-10 flex flex-col items-center gap-3 border-dashed p-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">এখনও কোনো বিল নেই</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          মিটার নম্বর যাচাই হলে আপনার মাসিক বিল এখানে দেখা যাবে। বিল জমা দিতে নিচের বাটনে ক্লিক করুন।
        </p>
        <Button asChild>
          <Link to="/bills">প্রথম বিল যোগ করুন</Link>
        </Button>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
