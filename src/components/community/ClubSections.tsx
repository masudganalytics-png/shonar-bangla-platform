import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ClubMemberCard } from "@/components/community/ClubMemberCard";
import type { ClubMembersData } from "@/components/community/use-club-members";
import type { CommunityBadge, CommunityPublicProfile } from "@/lib/community-shared";

type Shared = {
  data: ClubMembersData;
  profiles: Map<string, CommunityPublicProfile>;
  phones: Record<string, string>;
  canManage: boolean;
  onManage: (userId: string) => void;
};

function useBadgeMap(data: ClubMembersData) {
  return useMemo(() => {
    const m = new Map<string, CommunityBadge[]>();
    for (const b of data.badges) m.set(b.user_id, [...(m.get(b.user_id) ?? []), b.badge]);
    return m;
  }, [data.badges]);
}

/** Committee members grouped by position, following the saved position order. */
export function CommitteeList({ data, profiles, phones, canManage, onManage }: Shared) {
  const badgeMap = useBadgeMap(data);
  const groups = data.positions
    .map((p) => ({ position: p, members: data.members.filter((m) => m.position_id === p.id) }))
    .filter((g) => g.members.length > 0);

  if (groups.length === 0)
    return <Card className="p-8 text-center text-sm text-muted-foreground">এখনো কমিটি গঠন করা হয়নি।</Card>;

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.position.id}>
          <h3 className="mb-2 text-sm font-semibold text-primary">{g.position.name_bn}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.members.map((m) => (
              <ClubMemberCard
                key={m.user_id}
                member={m}
                profile={profiles.get(m.user_id)}
                positionName={g.position.name_bn}
                badges={badgeMap.get(m.user_id) ?? []}
                {...(phones[m.user_id] ? { phone: phones[m.user_id] } : {})}
                canManage={canManage}
                onManage={onManage}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** 🎖️ উপদেষ্টামণ্ডলী — everyone carrying the advisor badge (unlimited). */
export function AdvisorSection({ data, profiles, phones, canManage, onManage }: Shared) {
  const badgeMap = useBadgeMap(data);
  const advisors = data.members.filter((m) => (badgeMap.get(m.user_id) ?? []).includes("advisor"));

  if (advisors.length === 0)
    return <Card className="p-8 text-center text-sm text-muted-foreground">এখনো কোনো উপদেষ্টা নেই।</Card>;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-primary">🎖️ উপদেষ্টামণ্ডলী</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {advisors.map((m) => (
          <ClubMemberCard
            key={m.user_id}
            member={m}
            profile={profiles.get(m.user_id)}
            positionName={data.positions.find((p) => p.id === m.position_id)?.name_bn ?? "উপদেষ্টা"}
            badges={badgeMap.get(m.user_id) ?? []}
            {...(phones[m.user_id] ? { phone: phones[m.user_id] } : {})}
            canManage={canManage}
            onManage={onManage}
          />
        ))}
      </div>
    </div>
  );
}
