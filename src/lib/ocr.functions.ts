import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  image_data_url: z.string().min(32),
});

const SYSTEM_PROMPT = `You are an OCR assistant that reads Bangladeshi electricity bill images.
Extract the following fields and return ONLY a JSON object, no prose, no markdown fences:
{
  "month": <integer 1-12 or null>,
  "year": <4-digit integer or null>,
  "units": <number of consumed units or null>,
  "bill_amount": <total bill amount in BDT taka or null>,
  "meter_number": <meter number as string or null>
}
If a field cannot be read confidently, use null. Convert Bangla digits to Western digits.`;

export const ocrExtractBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the fields from this electricity bill." },
              { type: "image_url", image_url: { url: data.image_data_url } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) throw new Error("অনেক অনুরোধ — অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।");
      if (resp.status === 402) throw new Error("AI ক্রেডিট শেষ — অনুগ্রহ করে ওয়ার্কস্পেসে ক্রেডিট যোগ করুন।");
      throw new Error(`OCR ব্যর্থ: ${resp.status} ${text.slice(0, 200)}`);
    }

    const json = await resp.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { parsed = {}; }
      }
    }

    const toInt = (v: unknown) => {
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : NaN;
      return Number.isFinite(n) ? Math.trunc(n) : null;
    };
    const toNum = (v: unknown) => {
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : NaN;
      return Number.isFinite(n) ? n : null;
    };

    return {
      month: toInt(parsed.month),
      year: toInt(parsed.year),
      units: toNum(parsed.units),
      bill_amount: toNum(parsed.bill_amount),
      meter_number: parsed.meter_number ? String(parsed.meter_number).trim() : null,
    };
  });
