import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Megaphone, Droplet, GraduationCap, Store, Scale, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Kind = "all" | "notice" | "blood" | "tuition" | "business" | "legal";
type Item = {
  id: string;
  kind: Exclude<Kind, "all">;
  title: string;
  sub?: string | null;
  date: string;
  to?: string;
};

const CHIPS: { key: Kind; label: string }[] = [
  { key: "all", label: "সব" },
  { key: "notice", label: "নোটিশ" },
  { key: "blood", label: "রক্ত" },
  { key: "tuition", label: "টিউশন" },
  { key: "business", label: "ব্যবসা" },
  { key: "legal", label: "আইনি" },
];

const ICON: Record<Item["kind"], typeof Megaphone> = {
  notice: Megaphone, blood: Droplet, tuition: GraduationCap, business: Store, legal: Scale,
};
const TONE: Record<Item["kind"], string> = {
  notice: "bg-primary/10 text-primary",
  blood: "bg-primary/10 text-primary",
  tuition: "bg-primary/10 text-primary",
  business: "bg-primary/10 text-primary",
  legal: "bg-primary/10 text-primary",
};

export function LatestUpdates() {
  const [filter, setFilter] = useState<Kind>("all");
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [ann, br, tr, biz] = await Promise.all([
        supabase.from("announcements").select("id, title, body, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(6),
        supabase.from("blood_requests").select("id, patient_name, blood_group, hospital_name, created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(6),
        supabase.from("tuition_requests").select("id, subject, area, created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(6),
        supabase.from("businesses").select("id, slug, name, area, upazila, created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(6),
      ]);
      if (!alive) return;
      const merged: Item[] = [];
      for (const r of ann.data ?? []) merged.push({ id: `n-${r.id}`, kind: "notice", title: r.title, sub: r.body?.slice(0, 90) ?? null, date: r.published_at, to: "/notices" });
      for (const r of br.data ?? []) merged.push({ id: `b-${r.id}`, kind: "blood", title: `${r.blood_group} রক্ত প্রয়োজন — ${r.patient_name}`, sub: r.hospital_name, date: r.created_at, to: "/request-blood" });
      for (const r of tr.data ?? []) merged.push({ id: `t-${r.id}`, kind: "tuition", title: r.subject || "টিউশন অনুরোধ", sub: r.area, date: r.created_at, to: "/teachers/tuitions" });
      for (const r of biz.data ?? []) merged.push({ id: `bz-${r.id}`, kind: "business", title: r.name, sub: [r.area, r.upazila].filter(Boolean).join(", "), date: r.created_at, to: `/business/${r.slug || r.id}` });
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(merged);
    })();
    return () => { alive = false; };
  }, []);

  const filtered = (items ?? []).filter((i) => filter === "all" || i.kind === filter).slice(0, 9);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="সর্বশেষ আপডেট">
      <div className="mb-5">
        <div className="hairline-gold" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">সর্বশেষ আপডেট</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">সাম্প্রতিক কার্যক্রমের সময়রেখা</p>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${filter === c.key ? "border-primary/60 bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "border-border/70 bg-card/70 text-muted-foreground backdrop-blur hover:border-primary/50 hover:text-primary"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">এই মুহূর্তে কোনো আপডেট নেই।</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => {
            const Icon = ICON[it.kind];
            const inner = (
              <Card className="gold-hover flex h-full items-start gap-3 rounded-2xl p-4">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ring-border/60 ${TONE[it.kind]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{CHIPS.find((c) => c.key === it.kind)?.label}</Badge>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {new Date(it.date).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                  <h3 className="mt-1 truncate text-sm font-semibold">{it.title}</h3>
                  {it.sub && <p className="line-clamp-2 text-xs text-muted-foreground">{it.sub}</p>}
                </div>
              </Card>
            );
            return it.to ? (
              <Link key={it.id} to={it.to as string} className="block">{inner}</Link>
            ) : (
              <div key={it.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}
