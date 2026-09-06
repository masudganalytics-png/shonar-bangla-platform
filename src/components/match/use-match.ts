import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MATCH_PUBLIC_COLUMNS, type MatchRequest } from "@/lib/match-shared";

/** Approved (published) match requests — public, contact columns excluded. */
export function useApprovedMatchRequests() {
  return useQuery({
    queryKey: ["match", "approved"],
    queryFn: async (): Promise<MatchRequest[]> => {
      const { data, error } = await supabase
        .from("match_requests")
        .select(MATCH_PUBLIC_COLUMNS)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as MatchRequest[];
    },
  });
}

export function useMatchRequest(id: string) {
  return useQuery({
    queryKey: ["match", "one", id],
    queryFn: async (): Promise<MatchRequest | null> => {
      const { data, error } = await supabase
        .from("match_requests")
        .select(MATCH_PUBLIC_COLUMNS)
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as MatchRequest | null;
    },
  });
}

/** The signed-in user's shortlisted requests (ids). */
export function useMyShortlist(userId: string | undefined) {
  return useQuery({
    queryKey: ["match", "shortlist", userId],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("match_shortlists")
        .select("request_id")
        .eq("user_id", userId!);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.request_id);
    },
  });
}
