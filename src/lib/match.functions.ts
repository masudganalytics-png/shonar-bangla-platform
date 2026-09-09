import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type {
  MatchInterest,
  MatchRequest,
  MatchRequestWithContact,
} from "@/lib/match-shared";

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

const requestSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  looking_for: z.enum(["groom", "bride"]),
  created_for: z.enum(["self", "guardian"]),
  age_min: z.number().int().min(18).max(80),
  age_max: z.number().int().min(18).max(80),
  area: z.string().trim().min(1).max(80),
  education: z.string().trim().max(120).nullable(),
  profession: z.string().trim().max(120).nullable(),
  marital_status: z.enum(["unmarried", "divorced", "widowed"]),
  height_cm: z.number().int().min(100).max(230).nullable(),
  family_info: z.string().trim().max(1200).nullable(),
  expectations: z.string().trim().max(1200).nullable(),
  photo_url: z.string().trim().url().max(500).nullable(),
  contact_name: z.string().trim().max(80).nullable(),
  contact_phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন"),
});

/* -------------------------------------------------------------- create */

export const createMatchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => requestSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    if (data.age_max < data.age_min) throw new Error("বয়সের সীমা সঠিক নয়");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("match_requests")
      .insert({ ...data, user_id: context.userId, status: "pending", is_verified: false })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateMyMatchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => requestSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...values } = data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("match_requests")
      .update({ ...values, status: "pending", is_verified: false })
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyMatchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("match_requests")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------------------------------------------------------- mine */

export const listMyMatchRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MatchRequestWithContact[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("match_requests")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MatchRequestWithContact[];
  });

/* ------------------------------------------------------------ interest */

export const sendMatchInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        request_id: z.string().uuid(),
        sender_name: z.string().trim().min(2).max(80),
        sender_phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন"),
        message: z.string().trim().max(600).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req, error: reqErr } = await supabaseAdmin
      .from("match_requests")
      .select("id, user_id, status, is_verified")
      .eq("id", data.request_id)
      .maybeSingle();
    if (reqErr) throw new Error(reqErr.message);
    if (!req || req.status !== "approved" || !req.is_verified)
      throw new Error("এই রিকোয়েস্টটি এখন উপলব্ধ নয়");

    if (req.user_id === context.userId) throw new Error("নিজের রিকোয়েস্টে আগ্রহ প্রকাশ করা যায় না");

    const { data: existing } = await supabaseAdmin
      .from("match_interests")
      .select("id, status")
      .eq("request_id", data.request_id)
      .eq("sender_id", context.userId)
      .maybeSingle();
    if (existing && existing.status !== "withdrawn") {
      throw new Error("আপনি ইতিমধ্যে আগ্রহ প্রকাশ করেছেন");
    }

    if (existing) {
      const { error } = await supabaseAdmin
        .from("match_interests")
        .update({ ...data, status: "pending", sender_id: context.userId })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const { error } = await supabaseAdmin
      .from("match_interests")
      .insert({ ...data, sender_id: context.userId, status: "pending" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSentInterests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<Array<MatchInterest & { request: MatchRequest | null }>> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("match_interests")
        .select("*, request:match_requests(*)")
        .eq("sender_id", context.userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => {
        const { request, ...rest } = row as MatchInterest & {
          request: MatchRequestWithContact | null;
        };
        if (!request) return { ...rest, request: null };
        const { contact_name: _n, contact_phone: _p, admin_note: _a, ...safe } = request;
        return { ...rest, request: safe as MatchRequest };
      });
    },
  );

export const listReceivedInterests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<Array<MatchInterest & { request_name: string }>> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: mine, error: mineErr } = await supabaseAdmin
        .from("match_requests")
        .select("id, display_name")
        .eq("user_id", context.userId);
      if (mineErr) throw new Error(mineErr.message);
      const ids = (mine ?? []).map((r) => r.id);
      if (ids.length === 0) return [];
      const names = new Map((mine ?? []).map((r) => [r.id, r.display_name]));
      const { data, error } = await supabaseAdmin
        .from("match_interests")
        .select("*")
        .in("request_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((i) => ({
        ...(i as MatchInterest),
        request_name: names.get(i.request_id) ?? "",
      }));
    },
  );

/** Request owner accepts / declines; sender may withdraw. */
export const respondToMatchInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["accepted", "declined", "withdrawn"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: interest, error: iErr } = await supabaseAdmin
      .from("match_interests")
      .select("id, sender_id, request_id")
      .eq("id", data.id)
      .maybeSingle();
    if (iErr) throw new Error(iErr.message);
    if (!interest) throw new Error("আগ্রহটি পাওয়া যায়নি");

    const { data: req } = await supabaseAdmin
      .from("match_requests")
      .select("user_id")
      .eq("id", interest.request_id)
      .maybeSingle();

    const isOwner = req?.user_id === context.userId;
    const isSender = interest.sender_id === context.userId;
    if (data.status === "withdrawn" ? !isSender : !isOwner) {
      throw new Error("এই কাজটি করার অনুমতি নেই");
    }

    const { error } = await supabaseAdmin
      .from("match_interests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------- contact */

/**
 * Contact details are released only through this function: to the request
 * owner, to an admin, or to a sender whose interest has been accepted.
 */
export const getMatchContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(
    async ({ data, context }): Promise<{ contact_name: string | null; contact_phone: string | null }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await supabaseAdmin
        .from("match_requests")
        .select("user_id, contact_name, contact_phone, status")
        .eq("id", data.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return { contact_name: null, contact_phone: null };

      if (row.user_id === context.userId) {
        return { contact_name: row.contact_name, contact_phone: row.contact_phone };
      }

      const { data: isAdmin } = await (
        context.supabase as unknown as {
          rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null }>;
        }
      ).rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (isAdmin) return { contact_name: row.contact_name, contact_phone: row.contact_phone };

      const { data: accepted } = await supabaseAdmin
        .from("match_interests")
        .select("id")
        .eq("request_id", data.id)
        .eq("sender_id", context.userId)
        .eq("status", "accepted")
        .maybeSingle();
      if (accepted) return { contact_name: row.contact_name, contact_phone: row.contact_phone };

      return { contact_name: null, contact_phone: null };
    },
  );

/* --------------------------------------------------------------- admin */

export const listAllMatchRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MatchRequestWithContact[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("match_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return (data ?? []) as MatchRequestWithContact[];
  });

export const updateMatchModeration = createServerFn({ method: "POST" })
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
    const { error } = await supabaseAdmin.from("match_requests").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMatchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("match_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
