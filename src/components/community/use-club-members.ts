import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getCommunityPhones, getCommunityPublicPhones } from "@/lib/community.functions";
import type {
  CommunityBadge,
  CommunityMemberDetail,
  CommunityPositionRow,
} from "@/lib/community-shared";

export type ClubMembersData = {
  members: CommunityMemberDetail[];
  positions: CommunityPositionRow[];
  badges: Array<{ user_id: string; badge: CommunityBadge }>;
};

/**
 * Loads the full committee dataset for one community: members with their
 * committee position, badges and the ordered position list.
 */
export function useClubMembers(communityId: string | undefined) {
  return useQuery({
    queryKey: ["club-members", communityId],
    enabled: !!communityId,
    queryFn: async (): Promise<ClubMembersData> => {
      const [members, positions, badges] = await Promise.all([
        supabase
          .from("community_members")
          .select("user_id, role, position_id, custom_title, status, phone_visibility, created_at")
          .eq("community_id", communityId!),
        supabase
          .from("community_positions")
          .select("*")
          .eq("community_id", communityId!)
          .order("sort_order", { ascending: true }),
        supabase.from("community_member_badges").select("user_id, badge").eq("community_id", communityId!),
      ]);
      if (members.error) throw members.error;
      return {
        members: (members.data ?? []) as CommunityMemberDetail[],
        positions: (positions.data ?? []) as CommunityPositionRow[],
        badges: (badges.data ?? []) as Array<{ user_id: string; badge: CommunityBadge }>,
      };
    },
  });
}

/** Phone numbers the current viewer is allowed to see, keyed by user id. */
export function useClubPhones(communityId: string | undefined) {
  const { isAuthenticated, loading } = useAuth();
  return useQuery({
    queryKey: ["club-phones", communityId, isAuthenticated],
    enabled: !!communityId && !loading,
    queryFn: async (): Promise<Record<string, string>> => {
      const fn = isAuthenticated ? getCommunityPhones : getCommunityPublicPhones;
      return (await fn({ data: { communityId: communityId! } })) as Record<string, string>;
    },
  });
}
