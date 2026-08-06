import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Item = { id: string; kind: "post" | "event"; title: string; date: string };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("bn-BD", { day: "numeric", month: "long" });
}

export function CommunityUpdates() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [posts, events] = await Promise.all([
        supabase.from("community_posts").select("id, content, created_at").eq("is_hidden", false).order("created_at", { ascending: false }).limit(4),
        supabase.from("community_events").select("id, title, created_at").eq("is_hidden", false).order("created_at", { ascending: false }).limit(4),
      ]);
      if (!alive) return;
      const out: Item[] = [];
      for (const r of (posts.data ?? []) as any[]) out.push({ id: `p-${r.id}`, kind: "post", title: (r.content ?? "").slice(0, 120) || "নতুন পোস্ট", date: r.created_at });
      for (const r of (events.data ?? []) as any[]) out.push({ id: `e-${r.id}`, kind: "event", title: r.title, date: r.created_at });
      out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      setItems(out.slice(0, 6));
    })();
    return () => { alive = false; };
  }, []);

  if (items !== null && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="কমিউনিটি আপডেট">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <div className="hairline-gold" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">কমিউনিটি আপডেট</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">ফিড, ইভেন্ট, ক্লাব ও স্থানীয় ঘোষণা</p>
        </div>
        <Link to="/community" className="shrink-0 text-xs font-semibold text-primary hover:underline">সব দেখুন</Link>
      </div>

      {items === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.id} className="gold-hover flex h-full flex-col rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-border/60">
                  {it.kind === "event" ? <CalendarDays className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </span>
                <Badge variant="secondary" className="text-[11px]">{it.kind === "event" ? "ইভেন্ট" : "পোস্ট"}</Badge>
                <span className="ml-auto text-[11px] text-muted-foreground">{formatDate(it.date)}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{it.title}</p>
            </Card>
          ))}
        </div>
      )}

      <Link to="/community/feed" className="mt-6 inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10">
        কমিউনিটি ফিড দেখুন <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
