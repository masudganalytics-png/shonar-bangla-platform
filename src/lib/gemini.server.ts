import type { AiSearchResult, ChatTurn } from "@/lib/ai-search.functions";

/**
 * Writes a factual answer from already-retrieved PUBLIC records using the
 * user's own Google Gemini key (GEMINI_API_KEY). Only title/subtitle of
 * approved rows are sent — never contact or private fields.
 */
export async function geminiAnswer(question: string, results: AiSearchResult[], history: ChatTurn[]): Promise<string> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("GEMINI_API_KEY_MISSING");

  const context = results.length
    ? results.map((r, i) => `${i + 1}. [${r.kind}] ${r.title}${r.subtitle ? ` — ${r.subtitle}` : ""}`).join("\n")
    : "(no matching records)";

  // Free-tier quota is per model, so fall through a few Gemini models on 429/5xx/404.
  const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];
  const body = JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are KHIJIRION AI, a helpful assistant for the Ukhiya (Cox's Bazar, Bangladesh) community platform. " +
                "If the question is about local listings (shops, teachers, WiFi, advocates, blood donors, transport, etc.), answer ONLY from the provided KHIJIRION records; " +
                "if none match, say plainly that no matching information is on KHIJIRION right now. Never invent local names, phone numbers or listing details. " +
                "For general questions (knowledge, advice, how-to, greetings), answer helpfully from general knowledge. " +
                "Reply in the same language the user wrote in (Bangla or English; Bangla if unclear), concisely in 1-6 short sentences.",
            },
          ],
        },
        contents: [
          ...history.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content.slice(0, 500) }] })),
          { role: "user", parts: [{ text: `Question: ${question}\n\nKHIJIRION records:\n${context}` }] },
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 800,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
  let res: Response | null = null;
  for (const model of MODELS) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body,
    });
    if (res.ok) break;
    const detail = await res.text().catch(() => "");
    console.error("[gemini]", model, res.status, detail.slice(0, 200));
    if (!(res.status === 429 || res.status === 404 || res.status >= 500)) break;
  }
  if (!res || !res.ok) throw new Error(`GEMINI_${res?.status ?? 0}`);
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("GEMINI_EMPTY");
  return text;
}
