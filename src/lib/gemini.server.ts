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
    ? results.map((r, i) => `${i + 1}. [${r.kind}] ${r.title}${r.subtitle ? ` — ${r.subtitle}` : ""}${r.phone ? ` — phone: ${r.phone}` : ""}`).join("\n")
    : "(matching record nei — no matching records)";

  // Free-tier quota is per model, so fall through a few Gemini models on 429/5xx/404.
  const body = JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: [
                "You are KHIJIRION AI, a short, clear and friendly assistant for the KHIJIRION community platform of Ukhiya (Cox's Bazar, Bangladesh).",
                "You can help with: blood donors, teachers/tutors, workers (kajer lok), local businesses, WiFi/ISP, UkhiyaGo transport (car, CNG, bike), Reuse marketplace, Probashi info, bill calculator, CV builder, legal help, community and mosque info.",
                "LANGUAGE: reply in the language the user wrote in — Bangla, Banglish (Bangla in English letters) or English. Default Bangla. Keep answers to 1-5 short sentences.",
                "LOCAL DATA RULES: for questions about local people, listings, prices, addresses or phone numbers, use ONLY the KHIJIRION records given in the message (at most 5).",
                "If the records say none match, clearly say there is no matching record (Bangla: 'মিলে যায় এমন কোনো রেকর্ড নেই'). Never invent names, phone numbers, prices or addresses.",
                "Mention a phone number only if it appears in the records. If you do not know something platform-specific, say: 'এটা আমার কাছে নেই, Contact পেজে যোগাযোগ করুন।' (translate to the user's language).",
                "For general questions (knowledge, advice, how-to, greetings) you may answer from general knowledge.",
              ].join(" "),
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
  return callGemini(body);
}

const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];

let workingModel: string | null = null;

export async function callGemini(body: string): Promise<string> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("GEMINI_API_KEY_MISSING");
  let res: Response | null = null;
  // Try the last model that worked first, so failing models are not retried on every call.
  const order = workingModel ? [workingModel, ...MODELS.filter((m) => m !== workingModel)] : MODELS;
  for (const model of order) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body,
    });
    if (res.ok) {
      workingModel = model;
      break;
    }
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

export type InternalIntent = { category: string; keywords: string; blood_group: string | null };

/** Step a: question -> {category, keywords, blood_group} JSON. */
export async function geminiExtractIntent(question: string): Promise<InternalIntent> {
  const text = await callGemini(
    JSON.stringify({
      systemInstruction: {
        parts: [{ text:
          "Extract a search intent from a Bangla/Banglish/English question for a local directory in Ukhiya, Bangladesh. " +
          "category: one of blood, teacher, business, isp, ride, reuse, worker, legal, other. " +
          "keywords: short core search term (profession, subject, product, shop type, place), keep user's language; empty string if none. " +
          "blood_group: one of A+,A-,B+,B-,AB+,AB-,O+,O- if blood is asked (normalize 'O positive', 'ও পজিটিভ', 'O+ve' to O+), else null." }],
      },
      contents: [{ role: "user", parts: [{ text: question }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 200,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: { type: "STRING", enum: ["blood", "teacher", "business", "isp", "ride", "reuse", "worker", "legal", "other"] },
            keywords: { type: "STRING" },
            blood_group: { type: "STRING", nullable: true },
          },
          required: ["category", "keywords", "blood_group"],
        },
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  );
  return JSON.parse(text) as InternalIntent;
}

/** Step c: format ONLY the given records in Bangla. */
export async function geminiFormatResults(question: string, results: AiSearchResult[]): Promise<string> {
  const data = results
    .map((r, i) => `${i + 1}. ${r.title}${r.subtitle ? ` — ${r.subtitle}` : ""}${r.phone ? ` — ফোন: ${r.phone}` : ""}`)
    .join("\n");
  return callGemini(
    JSON.stringify({
      systemInstruction: {
        parts: [{ text:
          "You are KHIJIRION AI. Answer in Bangla, short and friendly, using ONLY the records given. " +
          "Do not add any name, phone, price, address or fact that is not in the records. List the records clearly." }],
      },
      contents: [{ role: "user", parts: [{ text: `প্রশ্ন: ${question}\n\nKHIJIRION রেকর্ড:\n${data}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 600, thinkingConfig: { thinkingBudget: 0 } },
    }),
  );
}

/** Step 3: general-knowledge answer in Bangla. */
export async function geminiGeneralAnswer(question: string, history: ChatTurn[]): Promise<string> {
  return callGemini(
    JSON.stringify({
      systemInstruction: {
        parts: [{ text:
          "You are KHIJIRION AI. Answer the question from general knowledge in Bangla (use English only if the user wrote English). " +
          "Keep it short and clear. Do not claim to have KHIJIRION platform data." }],
      },
      contents: [
        ...history.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content.slice(0, 500) }] })),
        { role: "user", parts: [{ text: question }] },
      ],
      generationConfig: { temperature: 0.6, maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } },
    }),
  );
}
