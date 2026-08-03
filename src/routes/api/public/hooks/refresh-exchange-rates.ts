import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, authorization",
};

const PROVIDER_URL = "https://open.er-api.com/v6/latest/BDT";
const FALLBACK_URL = "https://api.exchangerate-api.com/v4/latest/BDT";

type ProviderPayload = { rates?: Record<string, number> };

async function loadRates(): Promise<{ rates: Record<string, number>; provider: string }> {
  for (const url of [PROVIDER_URL, FALLBACK_URL]) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) continue;
      const json = (await res.json()) as ProviderPayload;
      if (json.rates && Object.keys(json.rates).length > 0) {
        return { rates: json.rates, provider: url };
      }
    } catch {
      // try next provider
    }
  }
  throw new Error("All exchange rate providers failed");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function refresh() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing, error: readError } = await supabaseAdmin
    .from("exchange_rates")
    .select("id, currency_code, exchange_rate_to_bdt");

  if (readError) {
    await supabaseAdmin
      .from("exchange_rate_logs")
      .insert({ success: false, message: `read failed: ${readError.message}`, provider: null, updated_count: 0 });
    return jsonResponse({ success: false, error: "database read failed" }, 500);
  }

  let rates: Record<string, number>;
  let provider: string;
  try {
    ({ rates, provider } = await loadRates());
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown provider error";
    await supabaseAdmin
      .from("exchange_rate_logs")
      .insert({ success: false, message, provider: PROVIDER_URL, updated_count: 0 });
    // Cached rates stay in place; the site keeps working.
    return jsonResponse({ success: false, error: message, cached: true }, 200);
  }

  const now = new Date().toISOString();
  let updated = 0;

  for (const row of existing ?? []) {
    const perBdt = rates[row.currency_code];
    if (!perBdt || perBdt <= 0) continue;
    const next = Number((1 / perBdt).toFixed(4));
    const prev = Number(row.exchange_rate_to_bdt ?? 0);
    if (!Number.isFinite(next) || next <= 0) continue;

    const status = next > prev ? "increased" : next < prev ? "decreased" : "stable";
    const { error: updateError } = await supabaseAdmin
      .from("exchange_rates")
      .update({
        exchange_rate_to_bdt: next,
        previous_rate: prev,
        rate_status: status,
        last_updated: now,
      })
      .eq("id", row.id);
    if (!updateError) updated++;
  }

  await supabaseAdmin
    .from("exchange_rate_logs")
    .insert({ success: true, message: null, provider, updated_count: updated });

  return jsonResponse({ success: true, updated, provider, updated_at: now });
}

export const Route = createFileRoute("/api/public/hooks/refresh-exchange-rates")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => refresh(),
      POST: async () => refresh(),
    },
  },
});
