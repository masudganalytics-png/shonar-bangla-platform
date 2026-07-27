import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const teacherStatus = z.enum(["pending", "approved", "rejected", "inactive"]);

const updateTeacherInput = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/),
  whatsapp: z.string().trim().regex(/^\+?\d{10,15}$/).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  category_id: z.string().uuid().optional().nullable(),
  subjects: z.string().max(500).optional().nullable(),
  qualification: z.string().max(500).optional().nullable(),
  experience_years: z.number().int().min(0).max(70).optional().nullable(),
  district: z.string().min(1),
  upazila: z.string().min(1),
  area: z.string().max(120).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  is_available: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  status: teacherStatus,
  photo_url: z.string().max(500).optional().nullable(),
});

const createTeacherInput = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/),
  whatsapp: z.string().trim().regex(/^\+?\d{10,15}$/).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  category_id: z.string().uuid().optional().nullable(),
  subjects: z.string().max(500).optional().nullable(),
  qualification: z.string().max(500).optional().nullable(),
  experience_years: z.number().int().min(0).max(70).optional().nullable(),
  district: z.string().min(1),
  upazila: z.string().min(1),
  area: z.string().max(120).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  photo_url: z.string().max(500).optional().nullable(),
  is_verified: z.boolean().optional(),
  is_available: z.boolean().optional(),
  status: teacherStatus,
});

async function ensureAdmin(ctx: { supabase: unknown; userId: string }) {
  const sb = ctx.supabase as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");
}

export type AdminTeacher = {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  category_id: string | null;
  category_name: string | null;
  subjects: string | null;
  qualification: string | null;
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

export const listAllTeachers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminTeacher[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [tRes, cRes] = await Promise.all([
      supabaseAdmin.from("teachers").select("*").order("created_at", { ascending: false }).limit(2000),
      supabaseAdmin.from("teacher_categories").select("id, name_bn"),
    ]);
    if (tRes.error) throw new Error(tRes.error.message);
    if (cRes.error) throw new Error(cRes.error.message);
    const cats = new Map<string, string>();
    for (const c of cRes.data ?? []) cats.set(c.id, c.name_bn);
    return (tRes.data ?? []).map((t) => ({
      ...t,
      category_name: t.category_id ? cats.get(t.category_id) ?? null : null,
    })) as AdminTeacher[];
  });

export const updateTeacherAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => updateTeacherInput.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin.from("teachers").update({
      ...rest,
      whatsapp: rest.whatsapp || null,
      email: rest.email || null,
      subjects: rest.subjects || null,
      qualification: rest.qualification || null,
      area: rest.area || null,
      description: rest.description || null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createTeacherAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => createTeacherInput.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("teachers").insert({
      ...data,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      subjects: data.subjects || null,
      qualification: data.qualification || null,
      area: data.area || null,
      description: data.description || null,
      is_available: data.is_available ?? true,
      submitted_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteTeacherAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("teachers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setTeacherStatus = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid(), status: teacherStatus }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("teachers").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setTeacherVerified = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid(), is_verified: z.boolean() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("teachers").update({ is_verified: data.is_verified }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertTeacherCategory = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid().optional(), name_bn: z.string().trim().min(1).max(100), slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/), sort_order: z.number().int().default(50), is_active: z.boolean().default(true) }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("teacher_categories").update({
        name_bn: data.name_bn, slug: data.slug, sort_order: data.sort_order, is_active: data.is_active,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("teacher_categories").insert({
        name_bn: data.name_bn, slug: data.slug, sort_order: data.sort_order, is_active: data.is_active,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTeacherCategory = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("teacher_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
