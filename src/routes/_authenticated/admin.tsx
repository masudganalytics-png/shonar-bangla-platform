import { createFileRoute, Link, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { Users, FileText, MessageSquare, LayoutDashboard, ShieldAlert, Megaphone, HardHat, GraduationCap, Store } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const TABS: ReadonlyArray<{ to: string; label: string; icon: typeof Users; exact?: boolean }> = [
  { to: "/admin", label: "ওভারভিউ", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "ব্যবহারকারী", icon: Users },
  { to: "/admin/bills", label: "বিল ব্যবস্থাপনা", icon: FileText },
  { to: "/admin/complaints", label: "অভিযোগ", icon: MessageSquare },
  { to: "/admin/announcements", label: "নোটিশ", icon: Megaphone },
  { to: "/admin/workers", label: "কাজের লোক", icon: HardHat },
  { to: "/admin/teachers", label: "শিক্ষক", icon: GraduationCap },
  { to: "/admin/businesses", label: "ব্যবসা", icon: Store },
];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "অ্যাডমিন প্যানেল — উখিয়া বিদ্যুৎ বিল" },
      { name: "description", content: "ব্যবহারকারী, বিল ও অভিযোগ ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">লোড হচ্ছে…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-xl font-bold">অ্যাক্সেস নেই</h1>
        <p className="mt-2 text-sm text-muted-foreground">এই পৃষ্ঠাটি শুধুমাত্র প্রশাসকদের জন্য।</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary underline">ড্যাশবোর্ডে ফিরে যান</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">অ্যাডমিন</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">প্রশাসনিক নিয়ন্ত্রণ প্যানেল</h1>
      </header>

      <nav className="mb-6 flex flex-wrap gap-1 overflow-x-auto rounded-lg border bg-card p-1">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}

// Re-export utility for children if needed
export function assertAdminOrRedirect(isAdmin: boolean) {
  if (!isAdmin) throw redirect({ to: "/dashboard" });
}
