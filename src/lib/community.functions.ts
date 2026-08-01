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

export type AdminCommunityReport = {
  target_type: "post" | "event";
  target_id: string;
  report_count: number;
  reasons: string[];
  last_reported_at: string;
  is_hidden: boolean;
  preview: string;
  community_id: string | null;
};

export const adminListCommunityReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCommunityReport[]> => {
    await ensurePlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("community_likes")
      .select("target_type, target_id, reason, created_at")
      .eq("kind", "report")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<{
      target_type: "post" | "event";
      target_id: string;
      reason: string | null;
      created_at: string;
    }>;
    if (rows.length === 0) return [];

    const postIds = rows.filter((r) => r.target_type === "post").map((r) => r.target_id);
    const eventIds = rows.filter((r) => r.target_type === "event").map((r) => r.target_id);

    const [posts, events] = await Promise.all([
      postIds.length
        ? supabaseAdmin.from("community_posts").select("id, content, is_hidden, community_id").in("id", postIds)
        : Promise.resolve({ data: [] as never[] }),
      eventIds.length
        ? supabaseAdmin.from("community_events").select("id, title, is_hidden, community_id").in("id", eventIds)
        : Promise.resolve({ data: [] as never[] }),
    ]);

    const meta = new Map<string, { preview: string; is_hidden: boolean; community_id: string | null }>();
    for (const p of (posts.data ?? []) as Array<{ id: string; content: string; is_hidden: boolean; community_id: string | null }>) {
      meta.set(`post:${p.id}`, { preview: p.content.slice(0, 160), is_hidden: p.is_hidden, community_id: p.community_id });
    }
    for (const e of (events.data ?? []) as Array<{ id: string; title: string; is_hidden: boolean; community_id: string | null }>) {
      meta.set(`event:${e.id}`, { preview: e.title, is_hidden: e.is_hidden, community_id: e.community_id });
    }

    const grouped = new Map<string, AdminCommunityReport>();
    for (const r of rows) {
      const key = `${r.target_type}:${r.target_id}`;
      const m = meta.get(key);
      if (!m) continue;
      const existing = grouped.get(key);
      if (existing) {
        existing.report_count += 1;
        if (r.reason) existing.reasons.push(r.reason);
      } else {
        grouped.set(key, {
          target_type: r.target_type,
          target_id: r.target_id,
          report_count: 1,
          reasons: r.reason ? [r.reason] : [],
          last_reported_at: r.created_at,
          is_hidden: m.is_hidden,
          preview: m.preview,
          community_id: m.community_id,
        });
      }
    }
    return Array.from(grouped.values()).sort((a, b) => b.report_count - a.report_count);
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
