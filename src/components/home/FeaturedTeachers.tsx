import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

type Row = { id: string; full_name: string; subjects: string | null; phone: string | null; photo_url: string | null };

export function FeaturedTeachers() {
  const [items, setItems] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("teachers")
        .select("id, full_name, subjects, phone, photo_url")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(4);
      if (alive) setItems((data ?? []) as Row[]);
    })();
    return () => { alive = false; };
  }, []);

  if (items !== null && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="ফিচার্ড শিক্ষক">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <div className="hairline-gold" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">ফিচার্ড শিক্ষক</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">যাচাইকৃত শিক্ষক ও টিউটর</p>
        </div>
        <Link to="/teachers" className="shrink-0 text-xs font-semibold text-primary hover:underline">সব দেখুন</Link>
      </div>

      {items === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t) => (
            <Card key={t.id} className="gold-hover group flex h-full flex-col rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-border/60">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.full_name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <GraduationCap className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{t.full_name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{t.subjects || "শিক্ষক"}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2 pt-5">
                {t.phone && (
                  <a href={`tel:${t.phone}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                    <Phone className="h-3.5 w-3.5" /> কল
                  </a>
                )}
                <Link to="/teachers/$id" params={{ id: t.id }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary">
                  বিস্তারিত <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
