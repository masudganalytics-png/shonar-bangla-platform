import { useEffect, useState } from "react";
import { Droplet, Briefcase, GraduationCap, Store, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stat = { label: string; value: number; icon: typeof Droplet; tone: string };

function toBanglaDigits(n: number) {
  return n.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value <= 0) { setN(0); return; }
    const start = performance.now();
    const duration = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{toBanglaDigits(n)}</>;
}

export function TodaysHighlights() {
  const [stats, setStats] = useState<Stat[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const iso = since.toISOString();
      const head = { count: "exact" as const, head: true };
      const [br, tj, tr, biz, lg] = await Promise.all([
        supabase.from("blood_requests").select("id", head).gte("created_at", iso),
        supabase.from("tuition_applications").select("id", head).gte("created_at", iso),
        supabase.from("tuition_requests").select("id", head).gte("created_at", iso),
        supabase.from("businesses").select("id", head).gte("created_at", iso),
        supabase.from("advocates").select("id", head).gte("created_at", iso),
      ]);
      if (!alive) return;
      setStats([
        { label: "রক্তের অনুরোধ", value: br.count ?? 0, icon: Droplet, tone: "bg-destructive/10 text-destructive" },
        { label: "চাকরি আবেদন", value: tj.count ?? 0, icon: Briefcase, tone: "bg-primary/10 text-primary" },
        { label: "নতুন টিউশন", value: tr.count ?? 0, icon: GraduationCap, tone: "bg-primary/10 text-primary" },
        { label: "নতুন ব্যবসা", value: biz.count ?? 0, icon: Store, tone: "bg-primary/10 text-primary" },
        { label: "নতুন আইনজীবী", value: lg.count ?? 0, icon: Scale, tone: "bg-primary/10 text-primary" },
      ]);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-label="আজকের হাইলাইট">
      <div className="mb-7">
        <div className="hairline-gold" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">আজকের হাইলাইট</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">আজকের নতুন কার্যক্রমের সারসংক্ষেপ</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(stats ?? Array.from({ length: 5 }).map(() => null)).map((s, i) => (
          s ? (
            <div key={s.label} className="gold-hover rounded-2xl border bg-card p-4 shadow-[var(--shadow-sm)]">
              <div className={`mb-2 grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ring-border/60 ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold tracking-tight"><CountUp value={s.value} /></div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ) : (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          )
        ))}
      </div>
    </section>
  );
}
