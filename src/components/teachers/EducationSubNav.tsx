import { Link } from "@tanstack/react-router";
import { Users, BookOpen, Sparkles, Newspaper, Trophy, GraduationCap } from "lucide-react";

const items = [
  { to: "/teachers", label: "শিক্ষক", icon: GraduationCap, exact: true },
  { to: "/teachers/tuitions", label: "টিউশন", icon: Users },
  { to: "/teachers/resources", label: "রিসোর্স", icon: BookOpen },
  { to: "/teachers/news", label: "শিক্ষা সংবাদ", icon: Newspaper },
  { to: "/teachers/achievements", label: "সাফল্য", icon: Trophy },
] as const;

export function EducationSubNav() {
  return (
    <nav className="mb-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max items-center gap-1.5">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            activeOptions={{ exact: it.exact }}
            className="flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent [&.active]:border-primary [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-medium"
          >
            <it.icon className="h-3.5 w-3.5" />
            {it.label}
          </Link>
        ))}
        <Sparkles className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
    </nav>
  );
}
