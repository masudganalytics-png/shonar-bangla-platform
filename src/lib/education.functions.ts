import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TuitionRequestAdmin, EducationNewsRow, AchievementRow, ResourceRow, TuitionApplicationRow } from "./education-shared";

async function ensureAdmin(ctx: { supabase: unknown; userId: string }) {
  const sb = ctx.supabase as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: { message: string } | null }> };
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");
}

// =============== TUITION REQUESTS ===============

const submitTuitionInput = z.object({
  parent_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/),
  district: z.string().min(1).default("Cox's Bazar"),
  upazila: z.string().min(1).default("Ukhiya"),
  area: z.string().max(120).optional().nullable(),
  student_class: z.string().min(1).max(60),
  subject: z.string().min(1).max(200),
  preferred_gender: z.enum(["male", "female", "any"]).default("any"),
  budget: z.number().min(0).max(1000000).optional().nullable(),
  days_per_week: z.number().int().min(1).max(7).optional().nullable(),
  preferred_time: z.string().max(80).optional().nullable(),
  mode: z.enum(["online", "offline", "both"]).default("offline"),
  notes: z.string().max(1000).optional().nullable(),
});

export const submitTuitionRequest = createServerFn({ method: "POST" })
  .inputValidator((data) => submitTuitionInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("tuition_requests").insert({
      ...data,
      area: data.area || null,
      notes: data.notes || null,
      preferred_time: data.preferred_time || null,
      status: "pending",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const listTuitionRequestsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TuitionRequestAdmin[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("tuition_requests").select("*").order("created_at", { ascending: false }).limit(2000);
    if (error) throw new Error(error.message);
    return (data ?? []) as TuitionRequestAdmin[];
  });

const upsertTuitionInput = submitTuitionInput.extend({
  id: z.string().uuid().optional(),
  status: z.enum(["pending", "approved", "rejected", "matched", "filled", "closed"]).optional(),
  matched_tutor_id: z.string().uuid().nullable().optional(),
});

export const upsertTuitionRequestAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => upsertTuitionInput.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, area: rest.area || null, notes: rest.notes || null, preferred_time: rest.preferred_time || null };
    if (id) {
      const { error } = await supabaseAdmin.from("tuition_requests").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: row, error } = await supabaseAdmin.from("tuition_requests").insert({ ...payload, status: payload.status ?? "approved" }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const setTuitionRequestStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["pending","approved","rejected","matched","filled","closed"]) }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tuition_requests").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTuitionRequestAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tuition_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== TUITION APPLICATIONS ===============

export const applyToTuition = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ request_id: z.string().uuid(), message: z.string().max(1000).optional() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const { data: teacher, error: tErr } = await sb.from("teachers").select("id, status").eq("submitted_by", context.userId).eq("status", "approved").maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!teacher) throw new Error("শুধুমাত্র অনুমোদিত শিক্ষক আবেদন করতে পারবেন");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tuition_applications").insert({
      request_id: data.request_id,
      tutor_id: teacher.id,
      applied_by: context.userId,
      message: data.message || null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTuitionApplicationsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TuitionApplicationRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("tuition_applications").select("*").order("created_at", { ascending: false }).limit(2000);
    if (error) throw new Error(error.message);
    return (data ?? []) as TuitionApplicationRow[];
  });

export const setTuitionApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["pending","accepted","rejected","withdrawn"]) }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tuition_applications").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== EDUCATION NEWS ===============

const newsInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(200),
  slug: z.string().max(200).optional().nullable(),
  cover_image_url: z.string().max(500).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  content: z.string().min(1),
  excerpt: z.string().max(400).optional().nullable(),
  publish_date: z.string().optional(),
  is_published: z.boolean().default(false),
});

export const upsertNews = createServerFn({ method: "POST" })
  .inputValidator((d) => newsInput.parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      slug: rest.slug || null,
      cover_image_url: rest.cover_image_url || null,
      category: rest.category || null,
      excerpt: rest.excerpt || null,
      publish_date: rest.publish_date || new Date().toISOString(),
    };
    if (id) {
      const { error } = await supabaseAdmin.from("education_news").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: row, error } = await supabaseAdmin.from("education_news").insert({ ...payload, author_id: context.userId }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const listNewsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EducationNewsRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("education_news").select("*").order("publish_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as EducationNewsRow[];
  });

export const deleteNews = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("education_news").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setNewsPublished = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), is_published: z.boolean() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("education_news").update({ is_published: data.is_published }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== ACHIEVEMENTS ===============

const achInput = z.object({
  id: z.string().uuid().optional(),
  student_name: z.string().trim().min(1).max(120),
  photo_url: z.string().max(500).optional().nullable(),
  institution: z.string().max(200).optional().nullable(),
  area: z.string().max(120).optional().nullable(),
  achievement: z.string().trim().min(1).max(300),
  story: z.string().max(3000).optional().nullable(),
  is_published: z.boolean().default(false),
});

export const upsertAchievement = createServerFn({ method: "POST" })
  .inputValidator((d) => achInput.parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, photo_url: rest.photo_url || null, institution: rest.institution || null, area: rest.area || null, story: rest.story || null };
    if (id) {
      const { error } = await supabaseAdmin.from("student_achievements").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: row, error } = await supabaseAdmin.from("student_achievements").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const listAchievementsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AchievementRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("student_achievements").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AchievementRow[];
  });

export const deleteAchievement = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("student_achievements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAchievementPublished = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), is_published: z.boolean() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("student_achievements").update({ is_published: data.is_published }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =============== STUDY RESOURCES ===============

const resourceInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  student_class: z.string().max(60).optional().nullable(),
  subject: z.string().max(120).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  thumbnail_url: z.string().max(500).optional().nullable(),
  resource_type: z.enum(["website","gdrive","youtube","pdf","link"]).default("link"),
  external_url: z.string().url().max(1000),
  is_published: z.boolean().default(false),
  sort_order: z.number().int().default(100),
});

export const upsertResource = createServerFn({ method: "POST" })
  .inputValidator((d) => resourceInput.parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = { ...rest, description: rest.description || null, student_class: rest.student_class || null, subject: rest.subject || null, category: rest.category || null, thumbnail_url: rest.thumbnail_url || null };
    if (id) {
      const { error } = await supabaseAdmin.from("study_resources").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: row, error } = await supabaseAdmin.from("study_resources").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const listResourcesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ResourceRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("study_resources").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ResourceRow[];
  });

export const deleteResource = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("study_resources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setResourcePublished = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), is_published: z.boolean() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("study_resources").update({ is_published: data.is_published }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
