import { useQuery } from "@tanstack/react-query";
import { getCommunityProfiles } from "@/lib/community.functions";
import type { CommunityPublicProfile } from "@/lib/community-shared";

/** Resolve publicly-safe display info (name + avatar + area) for a set of user ids. */
export function useCommunityProfiles(ids: (string | null | undefined)[]) {
  const unique = Array.from(new Set(ids.filter(Boolean) as string[])).sort();
  const q = useQuery({
    queryKey: ["community-profiles", unique.join(",")],
    enabled: unique.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => (await getCommunityProfiles({ data: { ids: unique } })) as CommunityPublicProfile[],
  });

  const map = new Map<string, CommunityPublicProfile>();
  for (const p of q.data ?? []) map.set(p.id, p);
  return {
    map,
    get: (id: string | null | undefined) => (id ? map.get(id) : undefined),
    isLoading: q.isLoading,
  };
}
