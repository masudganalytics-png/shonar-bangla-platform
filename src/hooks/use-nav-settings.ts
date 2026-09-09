import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Map of nav item key -> visibility. Missing keys default to visible. */
export function useNavSettings() {
  return useQuery({
    queryKey: ["nav-settings"],
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, boolean>> => {
      const { data, error } = await supabase.from("nav_settings").select("item_key, is_visible");
      if (error) throw new Error(error.message);
      const map: Record<string, boolean> = {};
      for (const row of data ?? []) map[row.item_key] = row.is_visible;
      return map;
    },
  });
}
