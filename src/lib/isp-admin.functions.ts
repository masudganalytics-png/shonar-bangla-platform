/**
 * ISP (WiFi) admin management server functions.
 * Mirrors the ukhiya-go-admin.functions.ts ensureAdmin + supabaseAdmin pattern.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { IspRecord } from "@/lib/isp-shared";

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

export const listIsps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IspRecord[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: isps, error }, { data: areas, error: aErr }, { data: packages, error: pErr }] =
      await Promise.all([
        supabaseAdmin.from("isps").select("*").order("sort_order").order("name"),
        supabaseAdmin.from("isp_areas").select("isp_id, area_key"),
        supabaseAdmin.from("isp_packages").select("*").order("sort_order"),
      ]);
    if (error) throw new Error(error.message);
    if (aErr) throw new Error(aErr.message);
    if (pErr) throw new Error(pErr.message);

    return (isps ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      note: i.note,
      phones: i.phones ?? [],
      is_btrc_approved: i.is_btrc_approved,
      is_active: i.is_active,
      sort_order: i.sort_order,
      areas: (areas ?? []).filter((a) => a.isp_id === i.id).map((a) => a.area_key),
      packages: (packages ?? [])
        .filter((p) => p.isp_id === i.id)
        .map((p) => ({
          id: p.id,
          isp_id: p.isp_id,
          name: p.name,
          speed_mbps: p.speed_mbps,
          price: p.price === null ? null : Number(p.price),
          note: p.note,
          is_active: p.is_active,
          sort_order: p.sort_order,
        })),
    }));
  });

const ispInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  note: z.string().default(""),
  phones: z.array(z.string().min(3)).default([]),
  is_btrc_approved: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(100),
  areas: z.array(z.string().min(1)).default([]),
});

export const saveIsp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ispInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { areas, id, ...fields } = data;

    let ispId = id;
    if (ispId) {
      const { error } = await supabaseAdmin.from("isps").update(fields).eq("id", ispId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("isps")
        .insert(fields)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      ispId = created.id;
    }

    const { error: delErr } = await supabaseAdmin.from("isp_areas").delete().eq("isp_id", ispId);
    if (delErr) throw new Error(delErr.message);
    if (areas.length > 0) {
      const { error: insErr } = await supabaseAdmin
        .from("isp_areas")
        .insert(areas.map((area_key) => ({ isp_id: ispId!, area_key })));
      if (insErr) throw new Error(insErr.message);
    }
    return { id: ispId };
  });

export const setIspActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("isps")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteIsp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("isps").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const packageInput = z.object({
  id: z.string().uuid().optional(),
  isp_id: z.string().uuid(),
  name: z.string().min(1),
  speed_mbps: z.number().int().nullable().default(null),
  price: z.number().nullable().default(null),
  note: z.string().default(""),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(100),
});

export const saveIspPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => packageInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...fields } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("isp_packages").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await supabaseAdmin
      .from("isp_packages")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteIspPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("isp_packages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
