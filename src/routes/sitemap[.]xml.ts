import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://khijirion.com";

type Entry = { path: string; changefreq?: string; priority?: string };

const STATIC_ENTRIES: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/notices", changefreq: "daily", priority: "0.8" },
  { path: "/business", changefreq: "daily", priority: "0.9" },
  { path: "/business/directory", changefreq: "daily", priority: "0.8" },
  { path: "/workers", changefreq: "daily", priority: "0.8" },
  { path: "/teachers", changefreq: "daily", priority: "0.8" },
  { path: "/teachers/news", changefreq: "daily", priority: "0.7" },
  { path: "/teachers/tuitions", changefreq: "daily", priority: "0.7" },
  { path: "/teachers/achievements", changefreq: "weekly", priority: "0.6" },
  { path: "/teachers/resources", changefreq: "weekly", priority: "0.6" },
  { path: "/legal", changefreq: "weekly", priority: "0.8" },
  { path: "/cv-builder", changefreq: "monthly", priority: "0.6" },
  { path: "/calculator", changefreq: "monthly", priority: "0.6" },
  { path: "/isp", changefreq: "monthly", priority: "0.5" },
  { path: "/helpline", changefreq: "monthly", priority: "0.5" },
  { path: "/utilities", changefreq: "monthly", priority: "0.5" },
  { path: "/stats", changefreq: "weekly", priority: "0.4" },
  { path: "/auth", changefreq: "monthly", priority: "0.3" },
];

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = [...STATIC_ENTRIES];

        const [bizRes, workersRes, teachersRes, advocatesRes] = await Promise.all([
          supabase.from("businesses").select("slug,id,updated_at").eq("status", "approved").limit(5000),
          supabase.from("workers").select("slug,id,updated_at").eq("status", "approved").limit(5000),
          supabase.from("teachers").select("slug,id,updated_at").eq("status", "approved").limit(5000),
          supabase.from("advocates").select("slug,id,updated_at").eq("is_active", true).limit(5000),
        ]);

        for (const b of bizRes.data ?? []) {
          entries.push({ path: `/business/${b.slug ?? b.id}`, changefreq: "weekly", priority: "0.7" });
        }
        for (const w of workersRes.data ?? []) {
          entries.push({ path: `/workers/${w.slug ?? w.id}`, changefreq: "weekly", priority: "0.6" });
        }
        for (const t of teachersRes.data ?? []) {
          entries.push({ path: `/teachers/${t.slug ?? t.id}`, changefreq: "weekly", priority: "0.6" });
        }
        for (const a of advocatesRes.data ?? []) {
          entries.push({ path: `/legal/${a.slug ?? a.id}`, changefreq: "weekly", priority: "0.6" });
        }

        const urls = entries.map((e) => [
          `  <url>`,
          `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
          e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
          e.priority ? `    <priority>${e.priority}</priority>` : null,
          `  </url>`,
        ].filter(Boolean).join("\n"));

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
