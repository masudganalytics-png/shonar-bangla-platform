import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, X, LogOut, User as UserIcon, Settings as SettingsIcon, Moon, Sun, ShieldCheck } from "lucide-react";
import logoAsset from "@/assets/ukhiya-logo.png.asset.json";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; auth?: boolean };
const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "হোম" },
  { to: "/stats", label: "পরিসংখ্যান" },
  { to: "/bills/new", label: "বিল জমা", auth: true },
  { to: "/compare", label: "তুলনা", auth: true },
  { to: "/calculator", label: "ক্যালকুলেটর" },
  { to: "/helpline", label: "হেল্পলাইন" },
];


export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "ব্য")
    .toString()
    .slice(0, 1)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img src={logoAsset.url} alt="উখিয়া বিদ্যুৎ বিল" className="h-9 w-9 shrink-0 rounded-xl object-contain" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold text-foreground sm:text-base">উখিয়া বিদ্যুৎ বিল</div>
            <div className="hidden text-[10px] text-muted-foreground sm:block">স্বচ্ছ বিল, সচেতন গ্রাহক</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            if (item.auth && !isAuthenticated) return null;
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="থিম পরিবর্তন">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* NotificationsBell hidden in MVP */}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-1 py-1 pr-3 transition-colors hover:bg-accent">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:inline">
                    {user?.user_metadata?.full_name || "প্রোফাইল"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserIcon className="mr-2 h-4 w-4" /> প্রোফাইল
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <SettingsIcon className="mr-2 h-4 w-4" /> সেটিংস
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" /> অ্যাডমিন প্যানেল
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> সাইন আউট
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">সাইন ইন</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "register" }}>
                  নিবন্ধন
                </Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="মেনু"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => {
              if (item.auth && !isAuthenticated) return null;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {item.label}
                </Link>
              );
            })}
            {!isAuthenticated && (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
                  <Link to="/auth">সাইন ইন</Link>
                </Button>
                <Button asChild size="sm" onClick={() => setOpen(false)}>
                  <Link to="/auth" search={{ mode: "register" }}>নিবন্ধন</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
