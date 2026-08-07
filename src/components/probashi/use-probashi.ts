import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyProbashiProfile } from "@/lib/probashi.functions";
import {
  PROBASHI_PUBLIC_COLUMNS,
  dhakaDayKey,
  type ProbashiProfile,
} from "@/lib/probashi-shared";

/** All approved profiles — the single source for directory, stats and highlights. */
export function useApprovedProbashi() {
  return useQuery({
    queryKey: ["probashi", "approved", dhakaDayKey()],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProbashiProfile[]> => {
      const { data, error } = await supabase
        .from("probashi_profiles")
        .select(PROBASHI_PUBLIC_COLUMNS)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ProbashiProfile[];
    },
  });
}

export function useProbashiProfile(slugOrId: string) {
  return useQuery({
    queryKey: ["probashi", "profile", slugOrId],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProbashiProfile | null> => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      const { data, error } = await supabase
        .from("probashi_profiles")
        .select(PROBASHI_PUBLIC_COLUMNS)
        .eq(isUuid ? "id" : "slug", slugOrId)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as ProbashiProfile | null;
    },
  });
}

/** The signed-in member's own profile (any status), for the register/edit form. */
export function useMyProbashiProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["probashi", "mine", userId],
    enabled: Boolean(userId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => await getMyProbashiProfile(),
  });
}
