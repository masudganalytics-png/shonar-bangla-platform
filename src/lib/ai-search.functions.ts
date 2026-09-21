import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  AI_MODULE_KEYS,
  AI_SCHEMA_VERSION,
  getModuleMap,
  schemaPromptSummary,
  selectColumns,
  validateSchemaMap,
  type AiModuleKey,
  type AiModuleMap,
} from "@/lib/ai-schema-map";

const inputSchema = z.object({ query: z.string().trim().min(2).max(200) });

export type AiSearchResult = {
  kind: AiModuleKey;
  id: string;
  slug: string | null;
  title: string;
  subtitle: string | null;
};

export type AiSearchResponse = {
  answer: string;
  results: AiSearchResult[];
  schemaVersion: string;
};

export type Intent = {
  categories: string[];
  keyword: string | null;
  area: string | null;
  blood_group: string | null;
  answer: string;
  clarify: string | null;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export async function extractIntent(query: string, history: ChatTurn[] = []): Promise<Intent> {
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
        `Modules available — ${schemaPromptSummary()}. ` +
        `categories must be a subset of: ${AI_MODULE_KEYS.join(", ")}. Pick every module the user could mean; if unclear pick business and teacher. ` +
        "keyword: the core search term, keep it in the user's original language and short (a shop name, subject, profession, place, product). null if none. " +
        "area: a place/union/area name if mentioned, else null. blood_group: one of A+,A-,B+,B-,AB+,AB-,O+,O- if the user asks for blood, else null. " +
        "answer: one short friendly conversational sentence in Bangla telling the user what is being searched. " +
        "clarify: if the request is too vague to pick a module or a keyword, a single short Bangla clarifying question; otherwise null. " +
        "Earlier turns of the same conversation may be provided — resolve follow-up questions using them and never ask the user to repeat themselves.",
      input: [
        ...history.map((turn) => ({
          role: turn.role,
          content: [
            { type: turn.role === "assistant" ? "output_text" : "input_text", text: turn.content.slice(0, 500) },
          ],
        })),
        { role: "user", content: [{ type: "input_text", text: query }] },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "search_intent",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              categories: { type: "array", items: { type: "string", enum: AI_MODULE_KEYS } },
              keyword: { type: ["string", "null"] },
              area: { type: ["string", "null"] },
              blood_group: { type: ["string", "null"] },
              answer: { type: "string" },
              clarify: { type: ["string", "null"] },
            },
            required: ["categories", "keyword", "area", "blood_group", "answer", "clarify"],
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

  return JSON.parse(text) as Intent;
}

type Row = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : typeof v === "number" ? String(v) : null);
const join = (...parts: Array<unknown>) => parts.map(str).filter(Boolean).join(", ") || null;

/** Title/subtitle projection per module — only mapped public fields are read. */
const PRESENTERS: Record<AiModuleKey, (r: Row) => { title: string; subtitle: string | null; slug: string | null }> = {
  business: (r) => ({ title: str(r.name) ?? "—", subtitle: join(r.area, r.upazila), slug: str(r.slug) }),
  teacher: (r) => ({ title: str(r.full_name) ?? "—", subtitle: str(r.subjects) ?? join(r.area, r.upazila), slug: null }),
  blood_donor: (r) => ({
    title: `${str(r.full_name) ?? "—"} — ${str(r.blood_group) ?? ""}`.trim(),
    subtitle: join(r.village, r.union_name),
    slug: null,
  }),
  match: (r) => ({ title: str(r.display_name) ?? "—", subtitle: join(r.profession, r.area), slug: null }),
  ukhiya_go: (r) => ({
    title: `${str(r.from_location) ?? "?"} → ${str(r.to_location) ?? "?"}`,
    subtitle: join(r.vehicle_label ?? r.vehicle_type, r.trip_date),
    slug: null,
  }),
  reuse: (r) => ({ title: str(r.title) ?? "—", subtitle: join(r.category, r.area ?? r.location), slug: null }),
  isp: (r) => ({ title: str(r.name) ?? "—", subtitle: str(r.note), slug: null }),
  govt_job: (r) => ({
    title: str(r.full_name) ?? "—",
    subtitle: join(r.designation, r.organization),
    slug: null,
  }),
};

async function searchModule(
  map: AiModuleMap,
  opts: { term: string; area: string | null; bloodGroup: string | null },
): Promise<AiSearchResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (supabase.from(map.table as never) as any).select(selectColumns(map)).limit(5);

  for (const [col, val] of Object.entries(map.visibility)) q = q.eq(col, val);

  if (map.key === "blood_donor" && opts.bloodGroup) {
    q = q.eq("blood_group", opts.bloodGroup);
  } else if (opts.term) {
    const like = `%${opts.term.replace(/[%,()]/g, " ")}%`;
    q = q.or(map.searchableFields.map((f) => `${f}.ilike.${like}`).join(","));
  }

  if (opts.area && map.areaFields.length) {
    const areaLike = `%${opts.area.trim().replace(/[%,()]/g, " ")}%`;
    q = q.or(map.areaFields.map((f) => `${f}.ilike.${areaLike}`).join(","));
  }

  const present = PRESENTERS[map.key];
  const project = (rows: Row[]): AiSearchResult[] =>
    rows.map((row) => {
      const { title, subtitle, slug } = present(row);
      return { kind: map.key, id: String(row.id), slug, title, subtitle };
    });

  const { data, error } = await q;
  if (error) return [];
  // No silent fallback: showing arbitrary latest rows would present unrelated
  // listings as if they answered the question.
  return project((data ?? []) as Row[]);
}

/**
 * Shared pipeline: natural language -> model intent -> allowlisted module search.
 * The model never sees data and never produces SQL; only the schema map is used.
 */
export async function performAiSearch(
  query: string,
  history: ChatTurn[] = [],
): Promise<AiSearchResponse & { clarify: string | null; aiUnavailable: boolean }> {
  const issues = validateSchemaMap();
  if (issues.length > 0) {
    throw new Error(`AI schema map validation failed: ${issues.map((i) => `${i.module}: ${i.problem}`).join("; ")}`);
  }

  let intent: Intent;
  let aiUnavailable = false;
  try {
    intent = await extractIntent(query, history);
  } catch {
    aiUnavailable = true;
    intent = {
      categories: ["business", "teacher", "reuse", "ukhiya_go"],
      keyword: query,
      area: null,
      blood_group: null,
      answer: "আপনার অনুসন্ধানের সম্ভাব্য ফলাফল দেখানো হচ্ছে।",
      clarify: null,
    };
  }

  const categories = new Set<AiModuleKey>(
    (intent.categories?.length ? intent.categories : ["business", "teacher"]).filter((c): c is AiModuleKey =>
      (AI_MODULE_KEYS as string[]).includes(c),
    ),
  );

  const term = (intent.keyword || query).trim();
  const bloodGroup = intent.blood_group && BLOOD_GROUPS.includes(intent.blood_group) ? intent.blood_group : null;
  if (bloodGroup) categories.add("blood_donor");

  const clarify = intent.clarify && intent.clarify.trim() ? intent.clarify.trim() : null;
  if (clarify) {
    return { answer: clarify, results: [], schemaVersion: AI_SCHEMA_VERSION, clarify, aiUnavailable };
  }

  const settled = await Promise.all(
    [...categories].map((key) => searchModule(getModuleMap(key), { term, area: intent.area, bloodGroup })),
  );
  const results = settled.flat();

  return {
    answer:
      results.length > 0
        ? intent.answer || "আপনার জন্য প্রাসঙ্গিক ফলাফল পাওয়া গেছে।"
        : "এই মুহূর্তে KHIJIRION-এ এর সঙ্গে মিলে এমন তথ্য পাওয়া যায়নি।",
    results,
    schemaVersion: AI_SCHEMA_VERSION,
    clarify: null,
    aiUnavailable,
  };
}

export const aiSearch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<AiSearchResponse> => {
    const { answer, results, schemaVersion } = await performAiSearch(data.query);
    return { answer, results, schemaVersion };
  });
