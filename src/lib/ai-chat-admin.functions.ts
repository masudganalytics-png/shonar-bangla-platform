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

export type AdminAiConversation = {
  id: string;
  title: string | null;
  account: "user" | "guest";
  owner_ref: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type AdminAiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type AdminAiChatStats = {
  conversations: number;
  messages: number;
  last_activity: string | null;
};

function maskRef(value: string): string {
  return value.length <= 8 ? `${value.slice(0, 4)}…` : `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export const listAiConversationsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ search: z.string().trim().max(80).optional() }).parse(d ?? {}))
  .handler(async ({ context, data }): Promise<AdminAiConversation[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("ai_conversations")
      .select("id, title, user_id, session_id, created_at, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (data.search) q = q.ilike("title", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const convos = (rows ?? []) as Array<{
      id: string;
      title: string | null;
      user_id: string | null;
      session_id: string;
      created_at: string;
      updated_at: string;
    }>;
    if (convos.length === 0) return [];

    const { data: msgs } = await supabaseAdmin
      .from("ai_messages")
      .select("conversation_id")
      .in("conversation_id", convos.map((c) => c.id));
    const counts = new Map<string, number>();
    for (const m of (msgs ?? []) as Array<{ conversation_id: string }>) {
      counts.set(m.conversation_id, (counts.get(m.conversation_id) ?? 0) + 1);
    }

    return convos.map((c) => ({
      id: c.id,
      title: c.title,
      account: c.user_id ? "user" : "guest",
      owner_ref: maskRef(c.user_id ?? c.session_id),
      message_count: counts.get(c.id) ?? 0,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
  });

export const getAiChatStatsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAiChatStats> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [convRes, msgRes, lastRes] = await Promise.all([
      supabaseAdmin.from("ai_conversations").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabaseAdmin.from("ai_messages").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("ai_conversations").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return {
      conversations: convRes.count ?? 0,
      messages: msgRes.count ?? 0,
      last_activity: (lastRes.data as { updated_at: string } | null)?.updated_at ?? null,
    };
  });

const idSchema = z.object({ conversationId: z.string().uuid() });

export const getAiConversationAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }): Promise<AdminAiMessage[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("ai_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return ((rows ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      role: r.role === "assistant" ? "assistant" : "user",
      content: String(r.content ?? ""),
      created_at: String(r.created_at),
    }));
  });

export const deleteAiConversationAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ai_conversations").delete().eq("id", data.conversationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
