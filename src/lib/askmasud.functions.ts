import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

/** AskMasud — pure general assistant. No database tables are read or written. */

const SYSTEM_PROMPT =
  "You are AskMasud, a friendly AI assistant on the KHIJIRION website for people in Ukhiya, Cox's Bazar, Bangladesh. Reply in Bangla by default, or in the user's language. Keep answers short and clear. Say when you are unsure and never invent facts. For local searches such as blood donors, tutors, shops or internet providers, tell the user to switch to KHIJIRION AI. For legal, medical, visa or financial questions, give general information only and advise checking with a professional.";

const GUEST_DAILY = 5;
const USER_DAILY = 30;
const LIMIT_TEXT = "আজকের সীমা শেষ, কাল আবার চেষ্টা করুন।";
const FAIL_TEXT = "এই মুহূর্তে উত্তর দিতে পারছি না, একটু পরে আবার চেষ্টা করুন।";

// Best-effort daily counter kept in server memory (no database by design).
const usage = new Map<string, { day: string; count: number }>();

async function signedInUserId(): Promise<string | null> {
  const header = getRequest()?.headers?.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  if (token.split(".").length !== 3) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getClaims(token);
    return error || !data?.claims?.sub ? null : String(data.claims.sub);
  } catch {
    return null;
  }
}

function clientIp(): string {
  const h = getRequest()?.headers;
  return h?.get("cf-connecting-ip") || h?.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(40),
});

export type AskMasudResponse = { ok: boolean; answer: string; limited?: boolean };

export const askMasud = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }): Promise<AskMasudResponse> => {
    const userId = await signedInUserId();
    const key = userId ? `u:${userId}` : `ip:${clientIp()}`;
    const day = new Date().toISOString().slice(0, 10);
    const entry = usage.get(key);
    const count = entry && entry.day === day ? entry.count : 0;
    if (count >= (userId ? USER_DAILY : GUEST_DAILY)) {
      console.log("[askmasud] daily limit reached", userId ? "user" : "guest");
      return { ok: false, answer: LIMIT_TEXT, limited: true };
    }
    usage.set(key, { day, count: count + 1 });

    const recent = data.messages.slice(-10);
    try {
      const { callGemini } = await import("@/lib/gemini.server");
      const answer = await callGemini(
        JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: recent.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          generationConfig: { temperature: 0.6, maxOutputTokens: 1200, thinkingConfig: { thinkingBudget: 0 } },
        }),
      );
      return { ok: true, answer };
    } catch (e) {
      console.error("[askmasud] gemini failed", e);
      return { ok: false, answer: FAIL_TEXT };
    }
  });
