import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listMyReuseListings } from "@/lib/reuse.functions";
import { REUSE_PUBLIC_COLUMNS, type ReuseListing } from "@/lib/reuse-shared";

export type ReuseFilters = {
  q: string;
  category: string;
  listingType: string;
  area: string;
  page: number;
  pageSize: number;
};

export type ReusePage = { rows: ReuseListing[]; total: number };

/** Public listings — RLS additionally restricts anon reads to approved rows. */
export function useReuseListings(f: ReuseFilters) {
  return useQuery({
    queryKey: ["reuse", "list", f],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ReusePage> => {
      let query = supabase
        .from("reuse_listings")
        .select(REUSE_PUBLIC_COLUMNS, { count: "exact" })
        .eq("status", "approved");

      if (f.category !== "all") query = query.eq("category", f.category);
      if (f.listingType !== "all") query = query.eq("listing_type", f.listingType);
      if (f.area !== "all") query = query.eq("area", f.area);

      const needle = f.q.trim();
      if (needle) {
        const safe = needle.replace(/[%,()]/g, " ");
        query = query.or([`title.ilike.%${safe}%`, `location.ilike.%${safe}%`].join(","));
      }

      const from = f.page * f.pageSize;
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, from + f.pageSize - 1);
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as unknown as ReuseListing[], total: count ?? 0 };
    },
  });
}

export function useReuseListing(id: string) {
  return useQuery({
    queryKey: ["reuse", "detail", id],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<ReuseListing | null> => {
      const { data, error } = await supabase
        .from("reuse_listings")
        .select(REUSE_PUBLIC_COLUMNS)
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as unknown as ReuseListing | null;
    },
  });
}

export function useMyReuseListings(userId: string | undefined) {
  return useQuery({
    queryKey: ["reuse", "mine", userId],
    enabled: Boolean(userId),
    staleTime: 0,
    queryFn: async () => await listMyReuseListings(),
  });
}
