import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/** AskMasud streaming endpoint — general assistant, word-by-word answers. */

const SYSTEM_PROMPT =
  "You are AskMasud, a friendly AI assistant on the KHIJIRION website for people in Ukhiya, Cox's Bazar, Bangladesh. Reply in Bangla by default, or in the user's language. Keep answers short and clear. Say when you are unsure and never invent facts. For local searches such as blood donors, tutors, shops or internet providers, tell the user to switch to KHIJIRION AI. For legal, medical, visa or financial questions, give general information only and advise checking with a professional.";

const GUEST_DAILY = 5;
const USER_DAILY = 30;
const LIMIT_TEXT = "আজকের সীমা শেষ, কাল আবার চেষ্টা করুন।";
const FAIL_TEXT = "এই মুহূর্তে উত্তর দিতে পারছি না, একটু পরে আবার চেষ্টা করুন।";
const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(40),
});

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export const Route = createFileRoute("/api/askmasud")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof schema>;
        try {
          parsed = schema.parse(await request.json());
        } catch {
          return text("Invalid request", 400);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Identify signed-in user (optional), else IP.
        let userId: string | null = null;
        const auth = request.headers.get("authorization");
        if (auth?.startsWith("Bearer ") && auth.slice(7).split(".").length === 3) {
          const { data } = await supabaseAdmin.auth.getClaims(auth.slice(7)).catch(() => ({ data: null }));
          userId = data?.claims?.sub ? String(data.claims.sub) : null;
        }
        const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const key = userId ? `u:${userId}` : `ip:${ip}`;
        const { data: allowed, error: limitErr } = await supabaseAdmin.rpc("askmasud_consume", {
          _key: key,
          _limit: userId ? USER_DAILY : GUEST_DAILY,
        });
        if (limitErr) console.error("[askmasud] limit check failed", limitErr.message);
        else if (!allowed) return text(LIMIT_TEXT, 429);

        const apiKey = process.env["GEMINI_API_KEY"];
        if (!apiKey) return text(FAIL_TEXT, 500);
        const body = JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: parsed.messages.slice(-10).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature: 0.6, maxOutputTokens: 1200, thinkingConfig: { thinkingBudget: 0 } },
        });

        let upstream: Response | null = null;
        for (const model of MODELS) {
          upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
            { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, body, signal: request.signal },
          ).catch(() => null);
          if (upstream?.ok) break;
          console.error("[askmasud]", model, upstream?.status);
          if (upstream && !(upstream.status === 429 || upstream.status === 404 || upstream.status >= 500)) break;
        }
        if (!upstream?.ok || !upstream.body) return text(FAIL_TEXT, 502);

        // Gemini SSE -> plain text chunks.
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        const out = upstream.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
              buffer += decoder.decode(chunk, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                try {
                  const evt = JSON.parse(line.slice(5).trim());
                  const t = (evt.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
                  if (t) controller.enqueue(encoder.encode(t));
                } catch {
                  /* partial */
                }
              }
            },
          }),
        );
        return new Response(out, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
        });
      },
    },
  },
});
