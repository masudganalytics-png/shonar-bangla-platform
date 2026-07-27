import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/admin";

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
  experience_years: z.number().int().min(0).max(70).optional(),
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
  experience_years: z.number().int().min(0).max(70).optional(),
  district: z.string().min(1),
  upazila: z.string().min(1),
  area: z.string().max(120).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  photo_url: z.string().max(500).optional().nullable(),
  is_verified: z.boolean().optional(),
  status: teacherStatus,
});

export const getTeachersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Access Denied", { status: 403 });

    const { data, error } = await supabaseAdmin
      .from("teachers")
      .select("*, teacher_categories(name_bn)")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Response(error.message, { status: 500 });
    return data ?? [];
  });

export const updateTeacherAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => updateTeacherInput.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Access Denied", { status: 403 });

    const { id, ...rest } = data;
    const { error } = await supabaseAdmin.from("teachers").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const createTeacherAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => createTeacherInput.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Access Denied", { status: 403 });

    const { error } = await supabaseAdmin.from("teachers").insert({
      ...data,
      is_available: data.is_available ?? true,
    });
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const deleteTeacherAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Access Denied", { status: 403 });

    const { error } = await supabaseAdmin.from("teachers").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const createTeacherCategory = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ name_bn: z.string().trim().min(1).max(100), slug: z.string().trim().min(1).max(100), sort_order: z.number().int().min(0).optional() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Access Denied", { status: 403 });

    const { error } = await supabaseAdmin.from("teacher_categories").insert({ ...data, is_active: true });
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const deleteTeacherCategory = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Response("Access Denied", { status: 403 });

    const { error } = await supabaseAdmin.from("teacher_categories").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });
