import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(ctx: { supabase: unknown; userId: string }) {
  const sb = ctx.supabase as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");
}

export type AdminWorker = {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  category_id: string | null;
  category_name: string | null;
  skills: string | null;
  experience_years: number | null;
  district: string;
  upazila: string;
  area: string | null;
  photo_url: string | null;
  description: string | null;
  is_available: boolean;
  is_verified: boolean;
  status: "pending" | "approved" | "rejected" | "inactive";
  created_at: string;
};

export const listAllWorkers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminWorker[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [wRes, cRes] = await Promise.all([
      supabaseAdmin.from("workers").select("*").order("created_at", { ascending: false }).limit(2000),
      supabaseAdmin.from("worker_categories").select("id, name_bn"),
    ]);
    if (wRes.error) throw new Error(wRes.error.message);
    if (cRes.error) throw new Error(cRes.error.message);
    const cats = new Map<string, string>();
    for (const c of cRes.data ?? []) cats.set(c.id, c.name_bn);
    return (wRes.data ?? []).map((w) => ({
      ...w,
      category_name: w.category_id ? cats.get(w.category_id) ?? null : null,
    })) as AdminWorker[];
  });

export const setWorkerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "approved", "rejected", "inactive"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("workers").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setWorkerVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), is_verified: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("workers").update({ is_verified: data.is_verified }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("workers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreateWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      full_name: z.string().trim().min(1).max(120),
      phone: z.string().trim().min(6).max(30),
      whatsapp: z.string().trim().max(30).optional().nullable(),
      category_id: z.string().uuid().optional().nullable(),
      skills: z.string().trim().max(500).optional().nullable(),
      experience_years: z.number().int().min(0).max(80).optional().nullable(),
      district: z.string().trim().min(1).max(80).default("Cox's Bazar"),
      upazila: z.string().trim().min(1).max(80).default("Ukhiya"),
      area: z.string().trim().max(120).optional().nullable(),
      photo_url: z.string().url().optional().nullable(),
      description: z.string().trim().max(1000).optional().nullable(),
      is_available: z.boolean().default(true),
      is_verified: z.boolean().default(false),
      status: z.enum(["pending", "approved", "rejected", "inactive"]).default("approved"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("workers").insert({
      ...data,
      submitted_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const upsertWorkerCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      name_bn: z.string().trim().min(1).max(100),
      slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
      sort_order: z.number().int().default(50),
      is_active: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("worker_categories").update({
        name_bn: data.name_bn, slug: data.slug, sort_order: data.sort_order, is_active: data.is_active,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("worker_categories").insert({
        name_bn: data.name_bn, slug: data.slug, sort_order: data.sort_order, is_active: data.is_active,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteWorkerCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("worker_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
