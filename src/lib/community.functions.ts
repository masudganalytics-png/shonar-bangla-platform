import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Community module server functions.
 * Only publicly-safe profile fields are ever returned to unauthenticated callers.
 * Phone numbers are gated by `public.can_view_member_phone`.
 */

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

async function ensurePlatformAdmin(ctx: { supabase: unknown; userId: string }) {
  const sb = ctx.supabase as unknown as RpcClient;
  const { data, error } = await sb.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — শুধুমাত্র প্রশাসকের জন্য");
}

/** Public: resolve display names / avatars for feed authors. Never returns phone. */
export const getCommunityProfiles = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(d))
  .handler(async ({ data }) => {
    if (data.ids.length === 0) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, address")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      full_name: r.full_name,
      avatar_url: r.avatar_url,
      area: r.address,
    }));
  });

/** Public stats for a member profile page. */
export const getCommunityUserStats = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [members, events] = await Promise.all([
      supabaseAdmin.from("community_members").select("community_id, communities(kind)").eq("user_id", data.userId),
      supabaseAdmin.from("community_events").select("id", { count: "exact", head: true }).eq("organizer_id", data.userId),
    ]);
    if (members.error) throw new Error(members.error.message);
    const rows = (members.data ?? []) as Array<{ communities: { kind: string } | null }>;
    const count = (kind: string) => rows.filter((r) => r.communities?.kind === kind).length;
    return {
      communities: count("community"),
      clubs: count("club"),
      groups: count("group"),
      events: events.count ?? 0,
    };
  });

/**
 * Phone number lookup — visible only to the website admin, the person themselves,
 * or the owner/admin of a community the target has joined.
 */
export const getMemberPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ phone: string | null; allowed: boolean }> => {
    const sb = context.supabase as unknown as RpcClient;
    const { data: allowed, error } = await sb.rpc("can_view_member_phone", {
      _viewer: context.userId,
      _target: data.userId,
    });
    if (error) throw new Error(error.message);
    if (!allowed) return { phone: null, allowed: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("phone")
      .eq("id", data.userId)
      .maybeSingle();
    return { phone: row?.phone ?? null, allowed: true };
  });

/* ------------------ Platform admin moderation ------------------ */

export const adminListCommunityReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("community_likes")
      .select("*")
      .eq("kind", "report")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSetCommunityContentHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        targetType: z.enum(["post", "event"]),
        targetId: z.string().uuid(),
        isHidden: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensurePlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.targetType === "post" ? "community_posts" : "community_events";
    const { error } = await supabaseAdmin.from(table).update({ is_hidden: data.isHidden }).eq("id", data.targetId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetCommunityActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensurePlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("communities").update({ is_active: data.isActive }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
