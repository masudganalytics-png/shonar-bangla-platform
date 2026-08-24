/**
 * UkhiyaGo server functions — driver contact privacy.
 * Everything else uses the browser Supabase client under existing RLS.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type TripDriverContact = {
  driverName: string;
  phone: string | null;
  whatsapp: string | null;
};

/**
 * Reveal a trip's driver contact only to: the driver themselves, an admin,
 * or a passenger whose booking on this trip has been confirmed.
 */
export const getTripDriverContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ tripId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<TripDriverContact> => {
    const { supabase, userId } = context;

    const { data: trip, error: tripErr } = await supabase
      .from("ukhiya_go_trips")
      .select("id, driver_id")
      .eq("id", data.tripId)
      .maybeSingle();
    if (tripErr || !trip) throw new Error("trip_not_found");

    const [{ data: isAdmin }, { data: isDriver }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("is_ukhiya_go_driver_owner", {
        _driver_id: trip.driver_id,
        _user_id: userId,
      }),
    ]);

    let allowed = Boolean(isAdmin) || Boolean(isDriver);
    if (!allowed) {
      const { data: booking } = await supabase
        .from("ukhiya_go_bookings")
        .select("id")
        .eq("trip_id", data.tripId)
        .eq("passenger_id", userId)
        .in("status", ["confirmed", "completed"])
        .limit(1)
        .maybeSingle();
      allowed = Boolean(booking);
    }
    if (!allowed) throw new Error("forbidden");

    // Privileged read only after the caller has been authorized above.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: driver, error: driverErr } = await supabaseAdmin
      .from("ukhiya_go_drivers")
      .select("name, phone, whatsapp")
      .eq("id", trip.driver_id)
      .maybeSingle();
    if (driverErr || !driver) throw new Error("driver_not_found");

    return {
      driverName: driver.name,
      phone: driver.phone,
      whatsapp: driver.whatsapp,
    };
  });
