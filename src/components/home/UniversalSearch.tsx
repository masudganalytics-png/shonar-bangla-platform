import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Store, GraduationCap, Scale, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

type Group = {
  key: "business" | "teacher" | "advocate";
  label: string;
  icon: typeof Store;
  items: { id: string; slug: string | null; title: string; sub?: string | null }[];
};

const QUICK_LINKS: { label: string; to: string }[] = [
  { label: "রক্তদাতা", to: "/blood-donors" },
  { label: "টিউশন", to: "/teachers" },
  { label: "ব্যবসা", to: "/business" },
  { label: "আইনি সহায়তা", to: "/legal" },
  { label: "ওয়াইফাই", to: "/isp" },
  { label: "বিল ক্যালকুলেটর", to: "/calculator" },
];

export function UniversalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setGroups([]);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const [b, tch, a] = await Promise.all([
        supabase.from("businesses").select("id, slug, name, area, upazila").eq("status", "approved").ilike("name", like).limit(5),
        supabase.from("teachers").select("id, full_name, subjects, upazila").eq("status", "approved").ilike("full_name", like).limit(5),
        supabase.from("advocates").select("id, full_name, chamber_address").eq("is_active", true).ilike("full_name", like).limit(5),
      ]);
      if (!alive) return;
      const next: Group[] = [];
      if (b.data?.length) next.push({ key: "business", label: "স্থানীয় ব্যবসা", icon: Store,
        items: b.data.map((r: any) => ({ id: r.id, slug: r.slug, title: r.name, sub: [r.area, r.upazila].filter(Boolean).join(", ") })) });
      if (tch.data?.length) next.push({ key: "teacher", label: "শিক্ষক", icon: GraduationCap,
        items: tch.data.map((r: any) => ({ id: r.id, slug: null, title: r.full_name, sub: r.subjects || r.upazila })) });
      if (a.data?.length) next.push({ key: "advocate", label: "আইনজীবী", icon: Scale,
        items: a.data.map((r: any) => ({ id: r.id, slug: null, title: r.full_name, sub: r.chamber_address })) });
      setGroups(next);
      setLoading(false);
    }, 220);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  const hasResults = useMemo(() => groups.some((g) => g.items.length), [groups]);

  const goTo = (g: Group, item: Group["items"][number]) => {
    setOpen(false);
    if (g.key === "business") navigate({ to: "/business/$slug", params: { slug: item.slug || item.id } });
    else if (g.key === "teacher") navigate({ to: "/teachers/$id", params: { id: item.id } });
    else navigate({ to: "/legal/$id", params: { id: item.id } });
  };

  return (
    <section className="mx-auto -mt-8 max-w-3xl px-4 sm:px-6" aria-label="সার্বজনীন অনুসন্ধান">
      <div ref={ref} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-[var(--shadow-lg)] focus-within:ring-2 focus-within:ring-ring">
          <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="রক্ত, চাকরি, টিউশন, ব্যবসা খুঁজুন..."
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base outline-none placeholder:text-muted-foreground"
            aria-label="সার্বজনীন অনুসন্ধান"
          />
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {open && q.trim().length >= 2 && (
          <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] overflow-auto rounded-2xl border bg-popover p-2 shadow-[var(--shadow-lg)]">
            {!loading && !hasResults && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">কোনো ফলাফল পাওয়া যায়নি।</p>
            )}
            {groups.map((g) => (
              <div key={g.key} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <g.icon className="h-3.5 w-3.5" /> {g.label}
                </div>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() => goTo(g, it)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{it.title}</span>
                          {it.sub && <span className="block truncate text-xs text-muted-foreground">{it.sub}</span>}
                        </span>
                        <Badge variant="secondary" className="shrink-0 text-xs">{g.label}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {QUICK_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
