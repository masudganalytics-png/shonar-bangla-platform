import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Phone, ArrowRight, Store, GraduationCap, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Featured = {
  id: string;
  kind: "business" | "teacher" | "advocate";
  title: string;
  category?: string | null;
  desc?: string | null;
  phone?: string | null;
  image?: string | null;
  href: string;
};

const KIND_LABEL = { business: "ব্যবসা", teacher: "শিক্ষক", advocate: "আইনজীবী" } as const;
const KIND_ICON = { business: Store, teacher: GraduationCap, advocate: Scale } as const;

export function FeaturedServices() {
  const [items, setItems] = useState<Featured[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [b, t, a] = await Promise.all([
        supabase.from("businesses").select("id, slug, name, short_description, phone, logo_url, cover_url").eq("status", "approved").eq("is_featured", true).limit(3),
        supabase.from("teachers").select("id, full_name, subjects, phone, photo_url").eq("status", "approved").eq("is_verified", true).limit(2),
        supabase.from("advocates").select("id, full_name, chamber_address, whatsapp, photo_url").eq("is_active", true).eq("is_verified", true).limit(2),
      ]);
      if (!alive) return;
      const out: Featured[] = [];
      for (const r of (b.data ?? []) as any[]) out.push({ id: `b-${r.id}`, kind: "business", title: r.name, category: "স্থানীয় ব্যবসা", desc: r.short_description, phone: r.phone, image: r.cover_url || r.logo_url, href: `/business/${r.slug || r.id}` });
      for (const r of (t.data ?? []) as any[]) out.push({ id: `t-${r.id}`, kind: "teacher", title: r.full_name, category: "যাচাইকৃত শিক্ষক", desc: r.subjects, phone: r.phone, image: r.photo_url, href: `/teachers/${r.id}` });
      for (const r of (a.data ?? []) as any[]) out.push({ id: `a-${r.id}`, kind: "advocate", title: r.full_name, category: "আইনজীবী", desc: r.chamber_address, phone: r.whatsapp, image: r.photo_url, href: `/legal/${r.id}` });
      setItems(out.slice(0, 6));
    })();
    return () => { alive = false; };
  }, []);

  if (items !== null && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="ফিচার্ড সেবা">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">ফিচার্ড সেবা</h2>
          <p className="mt-1 text-sm text-muted-foreground">প্রশাসক নির্বাচিত জনপ্রিয় সেবা</p>
        </div>
      </div>

      {items === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Icon = KIND_ICON[it.kind];
            return (
              <Card key={it.id} className="group flex h-full flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  {it.image ? (
                    <img src={it.image} alt={it.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground"><Icon className="h-10 w-10 opacity-40" /></div>
                  )}
                  <Badge className="absolute left-3 top-3 bg-white/90 text-foreground shadow-sm hover:bg-white">{KIND_LABEL[it.kind]}</Badge>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="truncate text-base font-semibold">{it.title}</h3>
                  {it.category && <p className="text-xs text-primary">{it.category}</p>}
                  {it.desc && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{it.desc}</p>}
                  <div className="mt-auto flex items-center gap-2 pt-4">
                    {it.phone && (
                      <a href={`tel:${it.phone}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
                        <Phone className="h-3.5 w-3.5" /> কল করুন
                      </a>
                    )}
                    <Link to={it.href} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary">
                      বিস্তারিত <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
