import { createServerFn, getRequestHeader } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export interface CVSubmissionRow {
  id: string;
  client_cv_id: string;
  cv_name: string;
  full_name: string;
  phone: string;
  email: string;
  job_title: string;
  template: string;
  language: string;
  status: string;
  completion: number;
  data: unknown;
  ip_address: string | null;
  user_agent: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

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

/* --------------------------------------------------------- public save */

const submitSchema = z.object({
  client_cv_id: z.string().min(4).max(64),
  edit_token: z.string().min(8).max(128),
  cv_name: z.string().max(120).default(""),
  full_name: z.string().max(160).default(""),
  phone: z.string().max(40).default(""),
  email: z.string().max(160).default(""),
  job_title: z.string().max(160).default(""),
  template: z.string().max(40).default("government"),
  language: z.string().max(40).default("English"),
  status: z.enum(["draft", "completed"]).default("draft"),
  completion: z.number().int().min(0).max(100).default(0),
  data: z.unknown(),
});

/**
 * Public endpoint by design: the CV Builder requires no login. Rows are never
 * readable through the Data API — only admins can read them (RLS) and only the
 * holder of the row's edit_token can update it.
 */
export const saveCVSubmission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const payload = JSON.stringify(data.data ?? {});
    if (payload.length > 400_000) throw new Error("CV data too large");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip =
      (getRequestHeader("cf-connecting-ip") ||
        getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
        getRequestHeader("x-real-ip") ||
        "") || null;
    const ua = getRequestHeader("user-agent")?.slice(0, 400) ?? null;

    const existing = await supabaseAdmin
      .from("cv_submissions")
      .select("id, edit_token")
      .eq("client_cv_id", data.client_cv_id)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);

    const fields = {
      cv_name: data.cv_name,
      full_name: data.full_name,
      phone: data.phone,
      email: data.email,
      job_title: data.job_title,
      template: data.template,
      language: data.language,
      status: data.status,
      completion: data.completion,
      data: data.data as never,
      ip_address: ip,
      user_agent: ua,
    };

    if (existing.data) {
      if (existing.data.edit_token !== data.edit_token) throw new Error("Not allowed");
      const { error } = await supabaseAdmin
        .from("cv_submissions")
        .update(fields)
        .eq("id", existing.data.id);
      if (error) throw new Error(error.message);
      return { id: existing.data.id };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("cv_submissions")
      .insert({ ...fields, client_cv_id: data.client_cv_id, edit_token: data.edit_token })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

/* --------------------------------------------------------------- admin */

export const listCVSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CVSubmissionRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("cv_submissions")
      .select(
        "id, client_cv_id, cv_name, full_name, phone, email, job_title, template, language, status, completion, data, ip_address, user_agent, admin_notes, reviewed_at, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []) as CVSubmissionRow[];
  });

export const deleteCVSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cv_submissions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCVSubmissionAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        admin_notes: z.string().max(4000).optional(),
        reviewed: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.admin_notes !== undefined) patch['admin_notes'] = data.admin_notes;
    if (data.reviewed !== undefined) patch['reviewed_at'] = data.reviewed ? new Date().toISOString() : null;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("cv_submissions").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
