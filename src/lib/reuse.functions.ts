import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ReuseListingWithContact } from "@/lib/reuse-shared";

type Contact = { phone: string | null; whatsapp: string | null };
const NO_CONTACT: Contact = { phone: null, whatsapp: null };

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

const listingSchema = z.object({
  listing_type: z.enum(["sale", "donation"]),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).nullable(),
  category: z.string().trim().min(1).max(80),
  condition: z.string().trim().min(1).max(40),
  price: z.number().min(0).max(100000000).nullable(),
  location: z.string().trim().min(2).max(120),
  area: z.string().trim().max(80).nullable(),
  phone: z.string().trim().max(20).nullable(),
  whatsapp: z.string().trim().max(20).nullable(),
  image_url: z.string().trim().url().max(500).nullable(),
});

/* ------------------------------------------------------------- contact */

/**
 * Contact columns have no Data API grant, so they can only leave the database
 * through this function. Requires a signed-in user (KHIJIRION privacy pattern)
 * and only ever returns contacts of approved listings.
 */
export const getReuseContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(async ({ data }): Promise<Contact> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("reuse_listings")
      .select("phone, whatsapp, status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.status !== "approved") return NO_CONTACT;
    return { phone: row.phone ?? null, whatsapp: row.whatsapp ?? null };
  });

/* ---------------------------------------------------------------- mine */

export const listMyReuseListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReuseListingWithContact[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reuse_listings")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as ReuseListingWithContact[];
  });

export const createReuseListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listingSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; id: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const values = { ...data, price: data.listing_type === "donation" ? null : data.price };
    const { data: inserted, error } = await supabaseAdmin
      .from("reuse_listings")
      .insert({ ...values, user_id: context.userId, status: "pending" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

/** Owner-scoped edit. Content edits always go back to `pending` review. */
export const updateMyReuseListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listingSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    const { error } = await supabaseAdmin
      .from("reuse_listings")
      .update({
        ...values,
        price: values.listing_type === "donation" ? null : values.price,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Owner-scoped lifecycle change — never approves/rejects. */
export const setMyReuseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["sold", "donated", "hidden", "pending"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reuse_listings")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyReuseListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reuse_listings")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------- reports */

export const reportReuseListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        listing_id: z.string().uuid(),
        reason: z.string().trim().min(1).max(120),
        details: z.string().trim().max(600).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reuse_reports")
      .insert({ ...data, reporter_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------------------------------------- admin */

export const listAllReuseListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReuseListingWithContact[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reuse_listings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as ReuseListingWithContact[];
  });

export const updateReuseModeration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "sold", "donated", "hidden"]),
        admin_note: z.string().trim().max(500).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...values } = data;
    const { error } = await supabaseAdmin
      .from("reuse_listings")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReuseListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idSchema)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reuse_listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
