import { Link } from "@tanstack/react-router";
import { Phone, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeChips } from "@/components/community/BadgeChips";
import {
  MEMBER_ROLE_LABEL_BN,
  MEMBER_STATUS_LABEL_BN,
  formatDateBn,
  type CommunityBadge,
  type CommunityMemberDetail,
  type CommunityPublicProfile,
} from "@/lib/community-shared";

/**
 * One member of the club directory / committee. Phone is only rendered when
 * the caller already resolved it through the privacy-aware server function.
 */
export function ClubMemberCard({
  member,
  profile,
  positionName,
  badges,
  phone,
  canManage,
  onManage,
}: {
  member: CommunityMemberDetail;
  profile?: CommunityPublicProfile;
  positionName?: string | null;
  badges: CommunityBadge[];
  phone?: string;
  canManage: boolean;
  onManage?: (userId: string) => void;
}) {
  const name = profile?.full_name?.trim() || "ব্যবহারকারী";
  return (
    <Card className="p-3.5">
      <div className="flex items-start gap-3">
        <Link to="/community/u/$userId" params={{ userId: member.user_id }} className="shrink-0">
          <Avatar className="h-12 w-12">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={name} /> : null}
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to="/community/u/$userId"
              params={{ userId: member.user_id }}
              className="truncate text-sm font-semibold hover:underline"
            >
              {name}
            </Link>
            {member.role !== "member" ? (
              <Badge variant="outline" className="text-[10px]">
                {MEMBER_ROLE_LABEL_BN[member.role]}
              </Badge>
            ) : null}
            {member.status === "inactive" ? (
              <Badge variant="destructive" className="text-[10px]">
                {MEMBER_STATUS_LABEL_BN.inactive}
              </Badge>
            ) : null}
          </div>

          <div className="mt-0.5 text-xs text-muted-foreground">
            {member.custom_title || positionName || "সদস্য"}
          </div>

          <div className="mt-1.5">
            <BadgeChips badges={badges} />
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground">
            যোগদান: {formatDateBn(member.created_at)}
          </div>

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Phone className="h-3.5 w-3.5" /> {phone}
            </a>
          ) : null}
        </div>

        {canManage && onManage ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onManage(member.user_id)}>
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">সদস্য ব্যবস্থাপনা</span>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
