import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Admin-only: show/hide a header navigation item. */
export const setNavItemVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ item_key: z.string().min(1).max(120), is_visible: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("nav_settings")
      .upsert(
        { item_key: data.item_key, is_visible: data.is_visible },
        { onConflict: "item_key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
