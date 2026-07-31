import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgoBn, type CommunityPublicProfile } from "@/lib/community-shared";
import { cn } from "@/lib/utils";

export function AuthorChip({
  profile,
  userId,
  createdAt,
  subtitle,
  size = "sm",
}: {
  profile?: CommunityPublicProfile;
  userId: string;
  createdAt?: string;
  subtitle?: string;
  size?: "sm" | "md";
}) {
  const name = profile?.full_name?.trim() || "ব্যবহারকারী";
  const initial = name.slice(0, 1).toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Link to="/community/u/$userId" params={{ userId }} className="shrink-0">
        <Avatar className={cn(size === "md" ? "h-11 w-11" : "h-9 w-9")}>
          {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initial}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 leading-tight">
        <Link
          to="/community/u/$userId"
          params={{ userId }}
          className="block truncate text-sm font-semibold hover:underline"
        >
          {name}
        </Link>
        <div className="truncate text-xs text-muted-foreground">
          {[subtitle, createdAt ? timeAgoBn(createdAt) : null].filter(Boolean).join(" • ")}
        </div>
      </div>
    </div>
  );
}
