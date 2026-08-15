import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { TablesUpdate } from "@/integrations/supabase/types";
import type {
  GovtWorker,
  GovtWorkerStatus,
  GovtWorkerWithContact,
} from "@/lib/govt-shared";

type Contact = { phone: string | null; whatsapp: string | null; official_email: string | null };
const NO_CONTACT: Contact = { phone: null, whatsapp: null, official_email: null };

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

const idSchema = (d: unknown) => z.object({ id: z.string().uuid() }).parse(d);

/* ------------------------------------------------------------- contact */

/**
 * Contact fields have no Data API column grant, so they can only ever leave the
 * database through these two functions. Both re-check the profile's own
 * `phone_visibility` server-side — request manipulation cannot bypass it.
 */
export const getGovtContactPublic = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }): Promise<Contact> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("govt_workers")
      .select("phone, whatsapp, official_email, phone_visibility, status, is_verified")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.status !== "approved" || !row.is_verified) return NO_CONTACT;
    if (row.phone_visibility !== "public") return { ...NO_CONTACT, official_email: row.official_email ?? null };
    return { phone: row.phone ?? null, whatsapp: row.whatsapp ?? null, official_email: row.official_email ?? null };
  });

export const getGovtContactMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(async ({ data }): Promise<Contact> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("govt_workers")
      .select("phone, whatsapp, official_email, phone_visibility, status, is_verified")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.status !== "approved" || !row.is_verified) return NO_CONTACT;
    if (row.phone_visibility === "hidden") return { ...NO_CONTACT, official_email: row.official_email ?? null };
    return { phone: row.phone ?? null, whatsapp: row.whatsapp ?? null, official_email: row.official_email ?? null };
  });

/* ---------------------------------------------------------------- mine */

/** The signed-in user's own profile, with their own contact fields. */
export const getMyGovtProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GovtWorkerWithContact | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("govt_workers")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as GovtWorkerWithContact | null;
  });

/** Re-verification request: puts the caller's own profile back to pending. */
export const requestGovtReverification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("govt_workers")
      .update({ status: "pending", is_verified: false, verified_at: null })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------------------------------------- admin */

export const listAllGovtWorkers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GovtWorkerWithContact[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("govt_workers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return (data ?? []) as GovtWorkerWithContact[];
  });

export const updateGovtModeration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "hidden"]).optional(),
        is_verified: z.boolean().optional(),
        admin_note: z.string().trim().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    if (Object.keys(values).length === 0) return { ok: true };
    const patch: TablesUpdate<"govt_workers"> = { ...values };
    if (values.is_verified === true) {
      patch.verified_at = new Date().toISOString();
      patch.verified_by = context.userId;
    }
    if (values.is_verified === false) {
      patch.verified_at = null;
      patch.verified_by = null;
    }
    const { error } = await supabaseAdmin.from("govt_workers").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Approve + verify in one confirmed action. */
export const approveAndVerifyGovtWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("govt_workers")
      .update({
        status: "approved",
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateGovtWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().trim().min(2).max(100),
        designation: z.string().trim().min(2).max(120),
        organization: z.string().trim().min(2).max(150),
        department: z.string().trim().min(1).max(80),
        job_category: z.string().trim().max(80).nullable(),
        current_workplace: z.string().trim().max(150).nullable(),
        current_district: z.string().trim().min(1).max(80),
        current_upazila: z.string().trim().max(80).nullable(),
        ukhiya_area: z.string().trim().min(1).max(80),
        joining_year: z.number().int().min(1950).max(2100).nullable(),
        bio: z.string().trim().max(800).nullable(),
        tips_for_younger: z.string().trim().max(1200).nullable(),
        phone: z.string().trim().max(20).nullable(),
        whatsapp: z.string().trim().max(20).nullable(),
        official_email: z.string().trim().max(150).nullable(),
        phone_visibility: z.enum(["public", "members", "hidden"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    const { error } = await supabaseAdmin.from("govt_workers").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGovtWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("govt_workers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------- reports */

export type GovtReportRow = {
  id: string;
  worker_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
  worker_name: string | null;
};

export const listGovtReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GovtReportRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [rRes, wRes] = await Promise.all([
      supabaseAdmin.from("govt_worker_reports").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("govt_workers").select("id, full_name").limit(2000),
    ]);
    if (rRes.error) throw new Error(rRes.error.message);
    if (wRes.error) throw new Error(wRes.error.message);
    const names = new Map<string, string>();
    for (const w of wRes.data ?? []) names.set(w.id, w.full_name);
    return (rRes.data ?? []).map((r) => ({
      id: r.id,
      worker_id: r.worker_id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      created_at: r.created_at,
      worker_name: names.get(r.worker_id) ?? null,
    }));
  });

export const updateGovtReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "reviewed", "dismissed"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("govt_worker_reports")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type { GovtWorker, GovtWorkerStatus };

/* ------------------------------------------------- owner-scoped upsert */

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  photo_url: z.string().trim().url().max(500).nullable(),
  designation: z.string().trim().min(2).max(120),
  organization: z.string().trim().min(2).max(150),
  department: z.string().trim().min(1).max(80),
  job_category: z.string().trim().max(80).nullable(),
  current_workplace: z.string().trim().max(150).nullable(),
  current_district: z.string().trim().min(1).max(80),
  current_upazila: z.string().trim().max(80).nullable(),
  ukhiya_area: z.string().trim().min(1).max(80),
  joining_year: z.number().int().min(1950).max(2100).nullable(),
  bio: z.string().trim().max(800).nullable(),
  tips_for_younger: z.string().trim().max(1200).nullable(),
  phone: z.string().trim().max(20).nullable(),
  whatsapp: z.string().trim().max(20).nullable(),
  official_email: z.string().trim().email().max(150).nullable().or(z.literal("").transform(() => null)),
  phone_visibility: z.enum(["public", "members", "hidden"]),
  consent_given: z.boolean(),
});

/**
 * Create or update the caller's OWN profile only. Moderation columns
 * (status, is_verified, verified_*, admin_note) are never accepted here —
 * the `trg_govt_workers_guard` trigger still owns them.
 */
export const upsertMyGovtProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; id: string }> => {
    if (!data.consent_given) throw new Error("সম্মতি ছাড়া প্রোফাইল সংরক্ষণ করা যাবে না");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: findErr } = await supabaseAdmin
      .from("govt_workers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (findErr) throw new Error(findErr.message);

    if (existing) {
      const { error } = await supabaseAdmin
        .from("govt_workers")
        .update(data)
        .eq("id", existing.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true, id: existing.id };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("govt_workers")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });
