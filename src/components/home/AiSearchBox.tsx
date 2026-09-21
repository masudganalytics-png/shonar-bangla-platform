import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkle,
  Loader2,
  Plus,
  Send,
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
import { sendAiChatMessage } from "@/lib/ai-chat.functions";
import type { AiSearchResult } from "@/lib/ai-search.functions";

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

const SESSION_KEY = "khijirion-ai-session";

type ChatMessage = { role: "user" | "assistant"; content: string; results?: AiSearchResult[] };

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id || id.length < 8) {
    id = crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function AiSearchBox() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const send = useServerFn(sendAiChatMessage);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, loading]);

  const ask = async (term: string) => {
    const value = term.trim();
    if (value.length < 2 || loading) return;
    setQ("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: value }]);
    setLoading(true);
    try {
      const res = await send({
        data: { message: value, sessionId: getSessionId(), conversationId },
      });
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, results: res.results }]);
    } catch {
      setError("এই মুহূর্তে KHIJIRION AI-এর সঙ্গে সংযোগ করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setQ("");
    inputRef.current?.focus();
  };

  const open = (item: AiSearchResult) => {
    if (item.kind === "business") navigate({ to: "/business/$slug", params: { slug: item.slug || item.id } });
    else if (item.kind === "teacher") navigate({ to: "/teachers/$id", params: { id: item.id } });
    else if (item.kind === "match") navigate({ to: "/match/$id", params: { id: item.id } });
    else if (item.kind === "ukhiya_go")
      navigate({ to: "/services/ukhiya-go/trip/$tripId", params: { tripId: item.id } });
    else if (item.kind === "reuse")
      navigate({ to: "/services/reuse/$listingId", params: { listingId: item.id } });
    else if (item.kind === "isp") navigate({ to: "/isp" });
    else if (item.kind === "govt_job") navigate({ to: "/govt-jobs/$id", params: { id: item.id } });
    else navigate({ to: "/blood-donors" });
  };

  return (
    <section className="mx-auto mt-5 max-w-3xl px-4 sm:px-6" aria-label="KHIJIRION AI সহায়ক">
      <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-[var(--shadow-lg)] backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">KHIJIRION AI</p>
            <p className="text-xs text-muted-foreground">বাংলায় প্রশ্ন করুন, পরের প্রশ্নেও কথার খেই ধরে রাখবে</p>
          </div>
          {messages.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={newChat} className="shrink-0 rounded-full text-xs">
              <Plus className="mr-1 h-3.5 w-3.5" /> নতুন চ্যাট
            </Button>
          )}
        </div>

        {messages.length > 0 && (
          <div className="mb-3 max-h-80 space-y-3 overflow-y-auto pr-1">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                    {m.content}
                  </p>
                </div>
              ) : (
                <div key={i} className="space-y-1.5">
                  <p className="text-sm leading-relaxed">{m.content}</p>
                  {m.results && m.results.length > 0 && (
                    <ul className="space-y-1">
                      {m.results.map((item) => {
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
              ),
            )}
            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> খোঁজা হচ্ছে…
              </p>
            )}
            <div ref={endRef} />
          </div>
        )}

        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(q);
          }}
        >
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="যেমন: উখিয়ায় O+ রক্তদাতা দরকার"
            aria-label="KHIJIRION AI-কে প্রশ্ন করুন"
            className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/60"
          />
          <Button type="submit" disabled={loading || q.trim().length < 2} className="rounded-xl px-5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1.5 h-4 w-4" /> পাঠান</>}
          </Button>
        </form>

        {messages.length === 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void ask(s)}
                className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}
