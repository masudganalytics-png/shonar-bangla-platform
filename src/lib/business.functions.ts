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

export type AdminBusiness = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string | null;
  category_id: string | null;
  category_name: string | null;
  phone: string;
  whatsapp: string | null;
  address: string | null;
  area: string | null;
  union_name: string | null;
  upazila: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  is_verified: boolean;
  is_featured: boolean;
  view_count: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
};

export const listAllBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminBusiness[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [bRes, cRes] = await Promise.all([
      supabaseAdmin.from("businesses").select("*").order("created_at", { ascending: false }).limit(2000),
      supabaseAdmin.from("business_categories").select("id, name_bn"),
    ]);
    if (bRes.error) throw new Error(bRes.error.message);
    if (cRes.error) throw new Error(cRes.error.message);
    const cats = new Map<string, string>();
    for (const c of cRes.data ?? []) cats.set(c.id, c.name_bn);
    return (bRes.data ?? []).map((b) => ({
      id: b.id,
      owner_id: b.owner_id,
      name: b.name,
      slug: b.slug,
      category_id: b.category_id,
      category_name: b.category_id ? cats.get(b.category_id) ?? null : null,
      phone: b.phone,
      whatsapp: b.whatsapp,
      address: b.address,
      area: b.area,
      union_name: b.union_name,
      upazila: b.upazila,
      status: b.status,
      is_verified: b.is_verified,
      is_featured: b.is_featured,
      view_count: b.view_count ?? 0,
      avg_rating: Number(b.avg_rating ?? 0),
      review_count: b.review_count ?? 0,
      created_at: b.created_at,
    }));
  });

export const setBusinessStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "approved", "rejected", "suspended"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("businesses").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setBusinessVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), is_verified: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("businesses").update({ is_verified: data.is_verified }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setBusinessFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), is_featured: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("businesses").update({ is_featured: data.is_featured }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBusinessAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("businesses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------ Categories ------------------ */

export const upsertBusinessCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      name_bn: z.string().trim().min(1).max(80),
      slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
      group_bn: z.string().trim().min(1).max(60),
      icon: z.string().trim().max(10).optional().nullable(),
      sort_order: z.number().int().min(0).max(9999).default(0),
      is_active: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("business_categories").update({
        name_bn: data.name_bn, slug: data.slug, group_bn: data.group_bn,
        icon: data.icon ?? null, sort_order: data.sort_order, is_active: data.is_active,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("business_categories").insert({
        name_bn: data.name_bn, slug: data.slug, group_bn: data.group_bn,
        icon: data.icon ?? null, sort_order: data.sort_order, is_active: data.is_active,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteBusinessCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("business_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------ Reviews ------------------ */

export const listAllReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [rRes, bRes] = await Promise.all([
      supabaseAdmin.from("business_reviews").select("*").order("created_at", { ascending: false }).limit(1000),
      supabaseAdmin.from("businesses").select("id, name"),
    ]);
    if (rRes.error) throw new Error(rRes.error.message);
    if (bRes.error) throw new Error(bRes.error.message);
    const names = new Map<string, string>();
    for (const b of bRes.data ?? []) names.set(b.id, b.name);
    return (rRes.data ?? []).map((r) => ({ ...r, business_name: names.get(r.business_id) ?? "—" }));
  });

export const moderateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), is_hidden: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("business_reviews").update({ is_hidden: data.is_hidden }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReviewAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("business_reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------ View counter ------------------ */

export const incrementBusinessView = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // fetch + update (no atomic RPC available for a single-shot increment without a helper)
    const { data: row } = await supabaseAdmin.from("businesses").select("view_count").eq("id", data.id).maybeSingle();
    const cur = row?.view_count ?? 0;
    await supabaseAdmin.from("businesses").update({ view_count: cur + 1 }).eq("id", data.id);
    return { ok: true };
  });
