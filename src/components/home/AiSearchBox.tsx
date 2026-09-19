import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkle,
  Loader2,
  Store,
  GraduationCap,
  Droplet,
  HeartHandshake,
  Car,
  Recycle,
  Wifi,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiSearch, type AiSearchResponse, type AiSearchResult } from "@/lib/ai-search.functions";

const META: Record<AiSearchResult["kind"], { label: string; icon: typeof Store }> = {
  business: { label: "ব্যবসা", icon: Store },
  teacher: { label: "শিক্ষক", icon: GraduationCap },
  blood_donor: { label: "রক্তদাতা", icon: Droplet },
  match: { label: "ম্যাচ", icon: HeartHandshake },
  ukhiya_go: { label: "উখিয়াগো", icon: Car },
  reuse: { label: "রিইউজ", icon: Recycle },
  isp: { label: "ওয়াইফাই", icon: Wifi },
  govt_job: { label: "চাকরি", icon: Briefcase },
};

const SUGGESTIONS = [
  "উখিয়ায় O+ রক্তদাতা দরকার",
  "গণিতের ভালো শিক্ষক",
  "কাছাকাছি মোবাইল সার্ভিসিং দোকান",
];

export function AiSearchBox() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const run = useServerFn(aiSearch);

  const search = async (term: string) => {
    const value = term.trim();
    if (value.length < 2 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { query: value } });
      setData(res);
    } catch {
      setError("এই মুহূর্তে AI অনুসন্ধান করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const open = (item: AiSearchResult) => {
    if (item.kind === "business") navigate({ to: "/business/$slug", params: { slug: item.slug || item.id } });
    else if (item.kind === "teacher") navigate({ to: "/teachers/$id", params: { id: item.id } });
    else if (item.kind === "match") navigate({ to: "/match/$id", params: { id: item.id } });
    else navigate({ to: "/blood-donors" });
  };

  return (
    <section className="mx-auto mt-5 max-w-3xl px-4 sm:px-6" aria-label="KHIJIRION AI অনুসন্ধান">
      <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-[var(--shadow-lg)] backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">KHIJIRION AI</p>
            <p className="text-xs text-muted-foreground">বাংলায় প্রশ্ন লিখুন, প্রাসঙ্গিক সেবা খুঁজে দেবে</p>
          </div>
        </div>

        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void search(q);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="যেমন: উখিয়ায় O+ রক্তদাতা দরকার"
            aria-label="AI অনুসন্ধান"
            className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/60"
          />
          <Button type="submit" disabled={loading || q.trim().length < 2} className="rounded-xl px-5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "খুঁজুন"}
          </Button>
        </form>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQ(s);
                void search(s);
              }}
              className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {data && (
          <div className="mt-4 border-t pt-3">
            <p className="text-sm text-muted-foreground">{data.answer}</p>
            {data.results.length > 0 && (
              <ul className="mt-2 space-y-1">
                {data.results.map((item) => {
                  const meta = META[item.kind];
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => open(item)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <meta.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{item.title}</span>
                            {item.subtitle && (
                              <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                            )}
                          </span>
                        </span>
                        <Badge variant="secondary" className="shrink-0 text-xs">{meta.label}</Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
