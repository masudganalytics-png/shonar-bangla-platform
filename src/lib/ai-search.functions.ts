import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const inputSchema = z.object({ query: z.string().trim().min(2).max(200) });

export type AiSearchResult = {
  kind: "business" | "teacher" | "blood_donor" | "match";
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
};

export type AiSearchResponse = {
  answer: string;
  results: AiSearchResult[];
};

type Intent = {
  categories: string[];
  keyword: string | null;
  area: string | null;
  blood_group: string | null;
  answer: string;
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

async function extractIntent(query: string): Promise<Intent> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      reasoning: { effort: "low" },
      instructions:
        "You convert a Bangla or English local-services query for the Ukhiya (Bangladesh) directory KHIJIRION into a search intent. " +
        "Categories must be a subset of: business, teacher, blood_donor, match. Pick every category the user could mean; if unclear pick business and teacher. " +
        "keyword: the core search term, keep it in the user's original language and short (a shop name, subject, profession). null if none. " +
        "area: a place/union/area name if mentioned, else null. blood_group: one of A+,A-,B+,B-,AB+,AB-,O+,O- if the user asks for blood, else null. " +
        "answer: one short friendly sentence in Bangla telling the user what is being searched.",
      input: [{ role: "user", content: [{ type: "input_text", text: query }] }],
      text: {
        format: {
          type: "json_schema",
          name: "search_intent",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              categories: {
                type: "array",
                items: { type: "string", enum: ["business", "teacher", "blood_donor", "match"] },
              },
              keyword: { type: ["string", "null"] },
              area: { type: ["string", "null"] },
              blood_group: { type: ["string", "null"] },
              answer: { type: "string" },
            },
            required: ["categories", "keyword", "area", "blood_group", "answer"],
          },
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI_GATEWAY_${res.status}:${detail.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") text += evt.delta;
        else if (evt.type === "response.completed" && typeof evt.response?.output_text === "string" && !text) {
          text = evt.response.output_text;
        }
      } catch {
        /* ignore partial events */
      }
    }
  }

  const parsed = JSON.parse(text) as Intent;
  return parsed;
}

export const aiSearch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AiSearchResponse> => {
    let intent: Intent;
    try {
      intent = await extractIntent(data.query);
    } catch {
      intent = {
        categories: ["business", "teacher", "blood_donor", "match"],
        keyword: data.query,
        area: null,
        blood_group: null,
        answer: "আপনার অনুসন্ধানের সম্ভাব্য ফলাফল দেখানো হচ্ছে।",
      };
    }

    const categories = new Set(
      (intent.categories?.length ? intent.categories : ["business", "teacher"]).filter((c) =>
        ["business", "teacher", "blood_donor", "match"].includes(c),
      ),
    );
    const term = (intent.keyword || data.query).trim();
    const like = `%${term}%`;
    const areaLike = intent.area ? `%${intent.area.trim()}%` : null;
    const bloodGroup =
      intent.blood_group && BLOOD_GROUPS.includes(intent.blood_group) ? intent.blood_group : null;
    if (bloodGroup) categories.add("blood_donor");

    const results: AiSearchResult[] = [];

    const tasks: Promise<void>[] = [];

    if (categories.has("business")) {
      tasks.push(
        (async () => {
          let q = supabase
            .from("businesses")
            .select("id, slug, name, area, upazila, products")
            .eq("status", "approved")
            .limit(5);
          q = q.or(`name.ilike.${like},full_description.ilike.${like}`);
          if (areaLike) q = q.or(`area.ilike.${areaLike},upazila.ilike.${areaLike}`);
          const { data: rows } = await q;
          rows?.forEach((r) =>
            results.push({
              kind: "business",
              id: r.id,
              slug: r.slug,
              title: r.name,
              subtitle: [r.area, r.upazila].filter(Boolean).join(", ") || null,
            }),
          );
        })(),
      );
    }

    if (categories.has("teacher")) {
      tasks.push(
        (async () => {
          let q = supabase
            .from("teachers")
            .select("id, full_name, subjects, upazila, area")
            .eq("status", "approved")
            .limit(5);
          q = q.or(`full_name.ilike.${like},subjects.ilike.${like},qualification.ilike.${like}`);
          if (areaLike) q = q.or(`area.ilike.${areaLike},upazila.ilike.${areaLike}`);
          const { data: rows } = await q;
          rows?.forEach((r) =>
            results.push({
              kind: "teacher",
              id: r.id,
              slug: null,
              title: r.full_name,
              subtitle: r.subjects || [r.area, r.upazila].filter(Boolean).join(", ") || null,
            }),
          );
        })(),
      );
    }

    if (categories.has("blood_donor")) {
      tasks.push(
        (async () => {
          let q = supabase
            .from("blood_donors")
            .select("id, full_name, blood_group, village, union_name, available")
            .eq("status", "approved")
            .eq("is_active", true)
            .limit(5);
          if (bloodGroup) q = q.eq("blood_group", bloodGroup as never);
          else q = q.ilike("full_name", like);
          if (areaLike) q = q.or(`village.ilike.${areaLike},union_name.ilike.${areaLike}`);
          const { data: rows } = await q;
          rows?.forEach((r) =>
            results.push({
              kind: "blood_donor",
              id: r.id,
              slug: null,
              title: `${r.full_name} — ${r.blood_group}`,
              subtitle: [r.village, r.union_name].filter(Boolean).join(", ") || null,
            }),
          );
        })(),
      );
    }

    if (categories.has("match")) {
      tasks.push(
        (async () => {
          let q = supabase
            .from("match_requests")
            .select("id, display_name, area, profession, education, looking_for")
            .eq("status", "approved")
            .eq("is_verified", true)
            .limit(5);
          q = q.or(`display_name.ilike.${like},profession.ilike.${like},education.ilike.${like}`);
          if (areaLike) q = q.ilike("area", areaLike);
          const { data: rows } = await q;
          rows?.forEach((r) =>
            results.push({
              kind: "match",
              id: r.id,
              slug: null,
              title: r.display_name,
              subtitle: [r.profession, r.area].filter(Boolean).join(", ") || null,
            }),
          );
        })(),
      );
    }

    await Promise.all(tasks);

    return {
      answer:
        results.length > 0
          ? intent.answer || "আপনার জন্য প্রাসঙ্গিক ফলাফল পাওয়া গেছে।"
          : "দুঃখিত, এই মুহূর্তে মিল পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন।",
      results,
    };
  });
