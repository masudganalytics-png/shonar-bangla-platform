import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyGovtProfile } from "@/lib/govt.functions";
import { GOVT_PUBLIC_COLUMNS, type GovtWorker } from "@/lib/govt-shared";

export type GovtDirectoryFilters = {
  q: string;
  department: string;
  jobCategory: string;
  district: string;
  area: string;
  page: number;
  pageSize: number;
};

export type GovtDirectoryPage = { rows: GovtWorker[]; total: number };

/** Public directory — only approved + verified rows are readable by RLS. */
export function useGovtDirectory(f: GovtDirectoryFilters) {
  return useQuery({
    queryKey: ["govt", "directory", f],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<GovtDirectoryPage> => {
      let query = supabase
        .from("govt_workers")
        .select(GOVT_PUBLIC_COLUMNS, { count: "exact" })
        .eq("status", "approved")
        .eq("is_verified", true);

      if (f.department !== "all") query = query.eq("department", f.department);
      if (f.jobCategory !== "all") query = query.eq("job_category", f.jobCategory);
      if (f.district !== "all") query = query.eq("current_district", f.district);
      if (f.area !== "all") query = query.eq("ukhiya_area", f.area);

      const needle = f.q.trim();
      if (needle) {
        const safe = needle.replace(/[%,()]/g, " ");
        query = query.or(
          [
            `full_name.ilike.%${safe}%`,
            `designation.ilike.%${safe}%`,
            `department.ilike.%${safe}%`,
            `organization.ilike.%${safe}%`,
            `current_workplace.ilike.%${safe}%`,
            `job_category.ilike.%${safe}%`,
          ].join(","),
        );
      }

      const from = f.page * f.pageSize;
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, from + f.pageSize - 1);
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as unknown as GovtWorker[], total: count ?? 0 };
    },
  });
}

export function useGovtProfile(id: string) {
  return useQuery({
    queryKey: ["govt", "profile", id],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<GovtWorker | null> => {
      const { data, error } = await supabase
        .from("govt_workers")
        .select(GOVT_PUBLIC_COLUMNS)
        .eq("id", id)
        .eq("status", "approved")
        .eq("is_verified", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as GovtWorker | null;
    },
  });
}

/** The signed-in user's own profile (any status), including their own contact fields. */
export function useMyGovtProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["govt", "mine", userId],
    enabled: Boolean(userId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    queryFn: async () => await getMyGovtProfile(),
  });
}
