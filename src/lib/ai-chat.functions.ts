import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { searchModule, type AiSearchResult, type ChatTurn } from "@/lib/ai-search.functions";
import { getModuleMap, type AiModuleKey } from "@/lib/ai-schema-map";

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
  notFound: boolean;
  mode: "internal" | "external";
  rateLimited?: boolean;
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
  mode: z.enum(["internal", "external"]).default("internal"),
});

const RATE_LIMIT_PER_MIN = 10;
const NOT_FOUND_TEXT = "KHIJIRION-এ পাওয়া যায়নি।";
const EXTERNAL_NOTE = "\n\n_এটি সাধারণ তথ্য, KHIJIRION-এর ডেটা নয়।_";
const FALLBACK_TEXT = "দুঃখিত, এই মুহূর্তে AI উত্তর দিতে পারছে না। একটু পরে আবার চেষ্টা করুন।";

const CATEGORY_MODULES: Record<string, AiModuleKey[]> = {
  blood: ["blood_donor"],
  teacher: ["teacher"],
  business: ["business"],
  isp: ["isp"],
  ride: ["ukhiya_go"],
  reuse: ["reuse"],
  worker: ["worker"],
  legal: ["advocate"],
  other: ["business", "community", "mosque", "notice"],
};

/** O+, O positive, ও পজিটিভ, O+ve, o pos -> O+ */
export function normalizeBloodGroup(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let t = raw.toLowerCase().replace(/\s+/g, "");
  t = t.replace(/এবি/g, "ab").replace(/এ/g, "a").replace(/বি/g, "b").replace(/ও/g, "o");
  t = t.replace(/পজিটিভ|পজেটিভ|positive|pos|\+ve|\+/g, "+").replace(/নেগেটিভ|নেগিটিভ|negative|neg|-ve|−|-/g, "-");
  const m = t.match(/(ab|a|b|o)([+-])/);
  return m ? `${m[1].toUpperCase()}${m[2]}` : null;
}

async function rateLimited(userId: string | null, sessionId: string): Promise<boolean> {
  const sb = await admin();
  let cq = sb.from("ai_conversations").select("id").order("updated_at", { ascending: false }).limit(50);
  cq = userId ? cq.eq("user_id", userId) : cq.is("user_id", null).eq("session_id", sessionId);
  const { data: convs } = await cq;
  const ids = (convs ?? []).map((c: { id: string }) => c.id);
  if (!ids.length) return false;
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await sb
    .from("ai_messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .eq("role", "user")
    .gte("created_at", since);
  return (count ?? 0) >= RATE_LIMIT_PER_MIN;
}

const QUICK_RULES: Array<[string, RegExp]> = [
  ["blood", /rokto|blood|রক্ত|donor|ডোনার/i],
  ["isp", /wi-?fi|internet|broadband|\bisp\b|ওয়াইফাই|ওয়াই-ফাই|ইন্টারনেট|ব্রডব্যান্ড/i],
  ["legal", /lawyer|advocate|ukil|উকিল|আইনজীবী|অ্যাডভোকেট|এডভোকেট/i],
  ["teacher", /teacher|tutor|shikkhok|শিক্ষক|টিউটর|টিউশন/i],
  ["worker", /mistri|kajer lok|electrician|plumber|মিস্ত্রি|কাজের লোক|ইলেকট্রিশিয়ান|প্লাম্বার/i],
  ["ride", /gari|gadi|\bcng\b|bike|microbus|ukhiyago|গাড়ি|সিএনজি|বাইক|মাইক্রো|উখিয়াগো/i],
  ["reuse", /reuse|purono|second.?hand|পুরনো|পুরাতন|রিইউজ/i],
];
const FILLER = /\b(lagbe|ache|ase|kothay|khuji|need|want|find|please|plz|ukhiya|ukhiyay)\b|লাগবে|আছে|কোথায়|খুঁজছি|দরকার|চাই|উখিয়ায়|উখিয়া|কি|কে|\?|।/gi;
function quickCategory(q: string): string | null {
  const hits = QUICK_RULES.filter(([, re]) => re.test(q));
  return hits.length === 1 ? hits[0][0] : null;
}
function quickKeywords(q: string): string {
  const [, re] = QUICK_RULES.find(([, r]) => r.test(q))!;
  return q.replace(re, " ").replace(FILLER, " ").replace(/\s+/g, " ").trim();
}

async function internalAnswer(question: string, userId: string | null): Promise<{ answer: string; results: AiSearchResult[]; notFound: boolean }> {
  const { geminiExtractIntent, geminiFormatResults } = await import("@/lib/gemini.server");
  let intent: { category: string; keywords: string; blood_group: string | null };
  const quick = quickCategory(question);
  try {
    // Fast path: obvious category from keywords skips one Gemini round-trip.
    intent = quick ? { category: quick, keywords: quickKeywords(question), blood_group: null } : await geminiExtractIntent(question);
  } catch (e) {
    console.error("[khijirion-ai] intent extraction failed, using keyword fallback", e);
    intent = { category: "other", keywords: question, blood_group: null };
  }
  const bloodGroup = normalizeBloodGroup(intent.blood_group) ?? normalizeBloodGroup(question);
  const category = bloodGroup && intent.category === "other" ? "blood" : intent.category;
  const modules = CATEGORY_MODULES[category] ?? CATEGORY_MODULES.other;
  const term = (intent.keywords || "").trim();
  console.log("[khijirion-ai] intent", JSON.stringify({ category, keywords: term, blood_group: bloodGroup }));

  const lists = await Promise.all(
    modules.map(async (key) => {
      const map = getModuleMap(key);
      const rows = await searchModule(map, { term, area: null, bloodGroup: key === "blood_donor" ? bloodGroup : null });
      console.log(`[khijirion-ai] table=${map.table} results=${rows.length}`);
      return rows;
    }),
  );
  const results = lists.flat().slice(0, 5);

  // Blood donor phones only for signed-in users.
  const donorIds = results.filter((r) => r.kind === "blood_donor").map((r) => r.id);
  if (donorIds.length) {
    if (userId) {
      const sb = await admin();
      const { data } = await sb.from("blood_donors").select("id, phone").in("id", donorIds);
      const phones = new Map((data ?? []).map((d: { id: string; phone: string | null }) => [d.id, d.phone]));
      for (const r of results) if (r.kind === "blood_donor") r.phone = phones.get(r.id) ?? null;
    } else {
      for (const r of results) if (r.kind === "blood_donor") r.phone = null;
    }
  }
  console.log(`[khijirion-ai] total results=${results.length} signedIn=${Boolean(userId)}`);

  if (!results.length) return { answer: NOT_FOUND_TEXT, results: [], notFound: true };
  let answer: string;
  try {
    answer = await geminiFormatResults(question, results);
  } catch (e) {
    console.error("[khijirion-ai] format failed", e);
    answer = `KHIJIRION-এ ${results.length}টি ফলাফল পাওয়া গেছে (AI সাজাতে পারেনি):`;
  }
  if (!userId && donorIds.length) answer += "\n\n_রক্তদাতার ফোন নম্বর দেখতে লগইন করুন।_";
  return { answer, results, notFound: false };
}

export const sendAiChatMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ data }): Promise<AiChatSendResponse> => {
    const userId = await currentUserId();
    const sb = await admin();

    const [limited, existing] = await Promise.all([
      rateLimited(userId, data.sessionId),
      data.conversationId ? loadOwnedConversation(data.conversationId, userId, data.sessionId) : Promise.resolve(null),
    ]);
    if (limited) {
      console.log("[khijirion-ai] rate limited", userId ?? data.sessionId.slice(0, 6));
      return {
        conversationId: data.conversationId ?? "",
        title: null,
        answer: "আপনি এক মিনিটে ১০টির বেশি প্রশ্ন করেছেন। একটু অপেক্ষা করে আবার চেষ্টা করুন।",
        results: [],
        notFound: false,
        mode: data.mode,
        rateLimited: true,
      };
    }

    let conversation = existing;

    if (!conversation) {
      const { data: created, error } = await sb
        .from("ai_conversations")
        .insert({ user_id: userId, session_id: data.sessionId, title: buildTitle(data.message) })
        .select("id, user_id, session_id, title")
        .single();
      if (error || !created) throw new Error("CONVERSATION_CREATE_FAILED");
      conversation = created as ConversationRow;
    }

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
    let notFound = false;
    if (data.mode === "external") {
      try {
        const { geminiGeneralAnswer } = await import("@/lib/gemini.server");
        answer = (await geminiGeneralAnswer(data.message, history)) + EXTERNAL_NOTE;
        console.log("[khijirion-ai] external answer ok");
      } catch (e) {
        console.error("[khijirion-ai] external answer failed", e);
        answer = FALLBACK_TEXT;
      }
    } else {
      try {
        ({ answer, results, notFound } = await internalAnswer(data.message, userId));
      } catch (e) {
        console.error("[khijirion-ai] internal search failed", e);
        answer = FALLBACK_TEXT;
      }
    }

    // Never persist donor phones in chat history.
    const stored = results.map((r) => (r.kind === "blood_donor" ? { ...r, phone: null } : r));
    await sb.from("ai_messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: answer,
      metadata: stored.length ? { results: stored } : null,
    });
    await sb.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation.id);

    return { conversationId: conversation.id, title: conversation.title, answer, results, notFound, mode: data.mode };
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
