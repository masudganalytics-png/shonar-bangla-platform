import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { ProbashiProfile } from "@/lib/probashi-shared";

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

/* ------------------------------------------------------------ contact */

/**
 * Contact details are never exposed through the Data API (anon has no column
 * grant on phone/whatsapp). They are only released here, for approved profiles
 * that opted in, to signed-in members.
 */
export const getProbashiContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ phone: string | null; whatsapp: string | null }> => {
    const { data: row, error } = await context.supabase
      .from("probashi_profiles")
      .select("phone, whatsapp, show_contact, status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("প্রোফাইল পাওয়া যায়নি");
    if (row.status !== "approved" || !row.show_contact) {
      return { phone: null, whatsapp: null };
    }
    return { phone: row.phone ?? null, whatsapp: row.whatsapp ?? null };
  });

/* --------------------------------------------------------------- admin */

const adminUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
  is_verified: z.boolean().optional(),
});

export const listAllProbashi = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Array<ProbashiProfile & { phone: string | null; whatsapp: string | null }>> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("probashi_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<ProbashiProfile & { phone: string | null; whatsapp: string | null }>;
  });

export const updateProbashiModeration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => adminUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    if (Object.keys(values).length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("probashi_profiles").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProbashi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("probashi_profiles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
