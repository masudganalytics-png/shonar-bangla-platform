/**
 * UkhiyaGo admin moderation server functions.
 * Mirrors the govt.functions.ts ensureAdmin + supabaseAdmin pattern.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import type { UkhiyaGoVerificationStatus } from "@/lib/ukhiya-go-shared";

export type UkhiyaGoAdminVehicle = Pick<
  Tables<"ukhiya_go_vehicles">,
  | "id"
  | "vehicle_type"
  | "brand"
  | "model"
  | "registration_number"
  | "seating_capacity"
  | "is_active"
  | "verification_status"
  | "photos"
>;

export type UkhiyaGoAdminDriver = Tables<"ukhiya_go_drivers"> & {
  vehicles: UkhiyaGoAdminVehicle[];
};

async function ensureAdmin(ctx: { supabase: unknown; userId: string }) {
  const sb = ctx.supabase as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");
}

export const listUkhiyaGoDrivers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UkhiyaGoAdminDriver[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: drivers, error } = await supabaseAdmin
      .from("ukhiya_go_drivers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);

    const rows = drivers ?? [];
    if (rows.length === 0) return [];

    const { data: vehicles, error: vErr } = await supabaseAdmin
      .from("ukhiya_go_vehicles")
      .select(
        "id, driver_id, vehicle_type, brand, model, registration_number, seating_capacity, is_active, verification_status, photos",
      )
      .in(
        "driver_id",
        rows.map((d) => d.id),
      );
    if (vErr) throw new Error(vErr.message);

    const byDriver = new Map<string, UkhiyaGoAdminVehicle[]>();
    for (const v of vehicles ?? []) {
      const { driver_id, ...rest } = v;
      const list = byDriver.get(driver_id) ?? [];
      list.push(rest as UkhiyaGoAdminVehicle);
      byDriver.set(driver_id, list);
    }

    return rows.map((d) => ({ ...d, vehicles: byDriver.get(d.id) ?? [] }));
  });

export const moderateUkhiyaGoDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "suspended"]),
        admin_note: z.string().trim().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: TablesUpdate<"ukhiya_go_drivers"> = {
      verification_status: data.status as UkhiyaGoVerificationStatus,
    };
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note;

    if (data.status === "approved") {
      patch.verified_at = new Date().toISOString();
      patch.verified_by = context.userId;
    } else {
      patch.verified_at = null;
      patch.verified_by = null;
    }

    const { error } = await supabaseAdmin.from("ukhiya_go_drivers").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------- Construction material orders ------------------- */

export type MaterialOrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export type MaterialOrderRow = Tables<"construction_material_orders">;

export const listMaterialOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MaterialOrderRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("construction_material_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []) as MaterialOrderRow[];
  });

export const updateMaterialOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "delivered", "cancelled"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("construction_material_orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
