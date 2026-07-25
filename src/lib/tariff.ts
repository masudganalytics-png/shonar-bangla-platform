import { supabase } from "@/integrations/supabase/client";

export type TariffSlab = {
  id: string;
  provider: string;
  meter_type: string;
  slab_min: number;
  slab_max: number | null;
  rate_per_unit: number;
  sort_order: number;
};

export async function fetchTariffSlabs(provider: string, meterType: string): Promise<TariffSlab[]> {
  const { data, error } = await supabase
    .from("tariff_slabs")
    .select("id, provider, meter_type, slab_min, slab_max, rate_per_unit, sort_order")
    .eq("provider", provider)
    .eq("meter_type", meterType)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    ...r,
    rate_per_unit: Number(r.rate_per_unit),
  }));
}

export type CalculationBreakdown = {
  slab_min: number;
  slab_max: number | null;
  rate_per_unit: number;
  units_in_slab: number;
  subtotal: number;
};

export type CalculationResult = {
  units: number;
  total: number;
  effective_rate: number;
  breakdown: CalculationBreakdown[];
};

export function calculateBill(units: number, slabs: TariffSlab[]): CalculationResult {
  const u = Math.max(0, units);
  let remaining = u;
  let total = 0;
  const breakdown: CalculationBreakdown[] = [];

  for (const s of slabs) {
    if (remaining <= 0) break;
    const capacity =
      s.slab_max == null ? Infinity : Math.max(0, s.slab_max - s.slab_min + 1);
    const take = Math.min(remaining, capacity);
    if (take > 0) {
      const subtotal = take * s.rate_per_unit;
      total += subtotal;
      breakdown.push({
        slab_min: s.slab_min,
        slab_max: s.slab_max,
        rate_per_unit: s.rate_per_unit,
        units_in_slab: take,
        subtotal,
      });
      remaining -= take;
    }
  }

  return {
    units: u,
    total,
    effective_rate: u > 0 ? total / u : 0,
    breakdown,
  };
}
