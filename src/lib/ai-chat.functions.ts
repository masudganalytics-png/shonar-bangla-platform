import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { performAiSearch, type AiSearchResult, type ChatTurn } from "@/lib/ai-search.functions";

/** Number of previous turns sent to the model — kept small for cost control. */
const CONTEXT_TURNS = 6;
/** Messages returned to the browser for one conversation. */
const MESSAGE_LIMIT = 60;

export type AiChatRole = "user" | "assistant";

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  content: string;
  results: AiSearchResult[];
  created_at: string;
};

export type AiChatConversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type AiChatSendResponse = {
  conversationId: string;
  title: string | null;
  answer: string;
  results: AiSearchResult[];
};

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<AdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Optional identity: anonymous visitors are allowed, signed-in users are matched by id. */
async function currentUserId(): Promise<string | null> {
  const request = getRequest();
  const header = request?.headers?.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  if (token.split(".").length !== 3) return null;
  try {
    const sb = await admin();
    const { data, error } = await sb.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    return String(data.claims.sub);
  } catch {
    return null;
  }
}

function buildTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
}

type ConversationRow = { id: string; user_id: string | null; session_id: string; title: string | null };

async function loadOwnedConversation(
  conversationId: string,
  userId: string | null,
  sessionId: string,
): Promise<ConversationRow | null> {
  const sb = await admin();
  const { data } = await sb
    .from("ai_conversations")
    .select("id, user_id, session_id, title")
    .eq("id", conversationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  const owned = userId ? data.user_id === userId : data.user_id === null && data.session_id === sessionId;
  return owned ? (data as ConversationRow) : null;
}

const sendSchema = z.object({
  message: z.string().trim().min(2).max(500),
  sessionId: z.string().trim().min(8).max(64),
  conversationId: z.string().uuid().nullable().optional(),
});

export const sendAiChatMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ data }): Promise<AiChatSendResponse> => {
    const userId = await currentUserId();
    const sb = await admin();

    let conversation = data.conversationId
      ? await loadOwnedConversation(data.conversationId, userId, data.sessionId)
      : null;

    if (!conversation) {
      const { data: created, error } = await sb
        .from("ai_conversations")
        .insert({ user_id: userId, session_id: data.sessionId, title: buildTitle(data.message) })
        .select("id, user_id, session_id, title")
        .single();
      if (error || !created) throw new Error("CONVERSATION_CREATE_FAILED");
      conversation = created as ConversationRow;
    }

    // Short, recent context only — never the whole transcript.
    const { data: recent } = await sb
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(CONTEXT_TURNS);
    const history: ChatTurn[] = ((recent ?? []) as Array<{ role: string; content: string }>)
      .reverse()
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    await sb.from("ai_messages").insert({ conversation_id: conversation.id, role: "user", content: data.message });

    let answer: string;
    let results: AiSearchResult[] = [];
    try {
      const res = await performAiSearch(data.message, history);
      answer = res.answer;
      results = res.results;
      if (!res.clarify && process.env["GEMINI_API_KEY"]) {
        try {
          const { geminiAnswer } = await import("@/lib/gemini.server");
          answer = await geminiAnswer(data.message, results, history);
        } catch (e) {
          console.error("[ai-chat] gemini answer failed", e);
        }
      }
    } catch {
      answer = "KHIJIRION-এর তথ্য আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
    }

    await sb.from("ai_messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: answer,
      metadata: results.length ? { results } : null,
    });
    await sb.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation.id);

    return { conversationId: conversation.id, title: conversation.title, answer, results };
  });

const listSchema = z.object({ sessionId: z.string().trim().min(8).max(64) });

export const listMyAiConversations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data }): Promise<AiChatConversation[]> => {
    const userId = await currentUserId();
    const sb = await admin();
    let q = sb
      .from("ai_conversations")
      .select("id, title, created_at, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(20);
    q = userId ? q.eq("user_id", userId) : q.is("user_id", null).eq("session_id", data.sessionId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as AiChatConversation[];
  });

const messagesSchema = z.object({
  conversationId: z.string().uuid(),
  sessionId: z.string().trim().min(8).max(64),
});

export const getAiConversationMessages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => messagesSchema.parse(d))
  .handler(async ({ data }): Promise<AiChatMessage[]> => {
    const userId = await currentUserId();
    const owned = await loadOwnedConversation(data.conversationId, userId, data.sessionId);
    if (!owned) throw new Error("NOT_FOUND");
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("ai_messages")
      .select("id, role, content, metadata, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(MESSAGE_LIMIT);
    if (error) throw new Error(error.message);
    return ((rows ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      role: r.role === "assistant" ? "assistant" : "user",
      content: String(r.content ?? ""),
      results: (((r.metadata as { results?: AiSearchResult[] } | null)?.results ?? []) as AiSearchResult[]),
      created_at: String(r.created_at),
    }));
  });

export const deleteMyAiConversation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => messagesSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await currentUserId();
    const owned = await loadOwnedConversation(data.conversationId, userId, data.sessionId);
    if (!owned) throw new Error("NOT_FOUND");
    const sb = await admin();
    const { error } = await sb.from("ai_conversations").delete().eq("id", data.conversationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearMyAiConversations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const userId = await currentUserId();
    const sb = await admin();
    const q = sb.from("ai_conversations").delete();
    const { error } = userId
      ? await q.eq("user_id", userId)
      : await q.is("user_id", null).eq("session_id", data.sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
