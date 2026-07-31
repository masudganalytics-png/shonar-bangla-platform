import { Link } from "@tanstack/react-router";
import { MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GROUP_TYPE_LABEL_BN,
  KIND_LABEL_BN,
  communityPath,
  type CommunityRow,
} from "@/lib/community-shared";

export function CommunityCard({ c }: { c: CommunityRow }) {
  return (
    <Card className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link to="/community/c/$slug" params={{ slug: communityPath(c) }} className="block">
        <div className="relative h-28 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-emerald-500/20">
          {c.cover_url ? (
            <img src={c.cover_url} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute -bottom-6 left-4 h-12 w-12 overflow-hidden rounded-xl border-4 border-card bg-card shadow-sm">
            {c.logo_url ? (
              <img src={c.logo_url} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-primary/10 text-sm font-bold text-primary">
                {c.name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 pt-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {KIND_LABEL_BN[c.kind]}
            </Badge>
            {c.group_type ? (
              <Badge variant="outline" className="text-[10px]">
                {GROUP_TYPE_LABEL_BN[c.group_type]}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-base font-bold group-hover:text-primary">{c.name}</h3>
          {c.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            {c.area ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {c.area}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {c.member_count} সদস্য
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
