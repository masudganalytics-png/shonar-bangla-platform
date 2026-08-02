import { Badge } from "@/components/ui/badge";
import { BADGE_ICON, BADGE_LABEL_BN, type CommunityBadge } from "@/lib/community-shared";

/** Renders a member's badges inline next to their name. */
export function BadgeChips({ badges, className }: { badges: CommunityBadge[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <span className={className}>
      {badges.map((b) => (
        <Badge key={b} variant="secondary" className="mr-1 text-[10px] font-medium">
          {BADGE_ICON[b]} {BADGE_LABEL_BN[b]}
        </Badge>
      ))}
    </span>
  );
}
