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

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are KHIJIRION AI for the Ukhiya (Cox's Bazar, Bangladesh) local directory. Answer ONLY from the provided KHIJIRION records. " +
                "If there are no records, say plainly that no matching information is on KHIJIRION right now. Never invent names, phone numbers or details. " +
                "Reply in the user's language (Bangla by default) in 1-4 short sentences.",
            },
          ],
        },
        contents: [
          ...history.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content.slice(0, 500) }] })),
          { role: "user", parts: [{ text: `Question: ${question}\n\nKHIJIRION records:\n${context}` }] },
        ],
      }),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[gemini]", res.status, detail.slice(0, 300));
    throw new Error(`GEMINI_${res.status}`);
  }
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("GEMINI_EMPTY");
  return text;
}
