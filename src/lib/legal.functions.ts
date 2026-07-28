import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { AdvocateRow, LegalLeadRow } from "@/lib/legal-shared";

async function ensureAdmin(ctx: { supabase: unknown; userId: string }) {
  const sb = ctx.supabase as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");
}

const advocateSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2).max(120),
  photo_url: z.string().trim().max(500).optional().nullable(),
  practice_areas: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  chamber_address: z.string().trim().max(500).optional().nullable(),
  experience_years: z.number().int().min(0).max(80).optional().nullable(),
  languages: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  availability: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  whatsapp: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("").transform(() => null)),
  bio: z.string().trim().max(2000).optional().nullable(),
  is_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(100),
});

export const listAllAdvocates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdvocateRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("advocates").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdvocateRow[];
  });

export const upsertAdvocate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => advocateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("advocates").update(values).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: row, error } = await supabaseAdmin.from("advocates").insert(values).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteAdvocate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("advocates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LegalLeadRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("legal_leads").select("*").order("created_at", { ascending: false }).limit(5000);
    if (error) throw new Error(error.message);
    return (data ?? []) as LegalLeadRow[];
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "closed"]).optional(),
      admin_note: z.string().trim().max(1000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("legal_leads").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("legal_leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
