import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60, s-maxage=300",
};

export const Route = createFileRoute("/api/public/announcements")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const category = url.searchParams.get("category");
        const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(process.env.SUPABASE_URL!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        let q = supabase
          .from("announcements")
          .select("id, title, body, category, priority, location, starts_at, ends_at, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(limit);
        if (category) q = q.eq("category", category as Database["public"]["Enums"]["announcement_category"]);

        const { data, error } = await q;
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ items: data ?? [] }), { headers: { ...CORS, "Content-Type": "application/json" } });
      },
    },
  },
});
