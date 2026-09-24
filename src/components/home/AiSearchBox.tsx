import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  History,
  Trash2,
  ArrowLeft,
  Store,
  GraduationCap,
  Droplet,
  HeartHandshake,
  Car,
  Recycle,
  Wifi,
  Briefcase,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  sendAiChatMessage,
  listMyAiConversations,
  getAiConversationMessages,
  deleteMyAiConversation,
  type AiChatConversation,
} from "@/lib/ai-chat.functions";
import type { AiSearchResult } from "@/lib/ai-search.functions";
import logo from "@/assets/khijirion-logo.png.asset.json";

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
  "উখিয়ায় O+ রক্তদাতা",
  "গণিতের শিক্ষক",
  "মোবাইল সার্ভিসিং দোকান",
  "ওয়াইফাই সংযোগ",
  "উখিয়া থেকে কক্সবাজার গাড়ি",
  "পুরনো জিনিস বিক্রি",
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
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AiChatConversation[] | null>(null);
  const navigate = useNavigate();
  const send = useServerFn(sendAiChatMessage);
  const listFn = useServerFn(listMyAiConversations);
  const loadFn = useServerFn(getAiConversationMessages);
  const deleteFn = useServerFn(deleteMyAiConversation);

  const ask = async (term: string) => {
    const value = term.trim();
    if (value.length < 2 || loading) return;
    setQ("");
    setError(null);
    setShowHistory(false);
    setMessages((prev) => [...prev, { role: "user", content: value }]);
    setLoading(true);
    try {
      const res = await send({ data: { message: value, sessionId: getSessionId(), conversationId } });
      setConversationId(res.conversationId);
      setHistory(null);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, results: res.results }]);
    } catch {
      setError("এই মুহূর্তে KHIJIRION AI-এর সঙ্গে সংযোগ করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setShowHistory(false);
    setQ("");
  };

  const openHistory = async () => {
    setShowHistory(true);
    if (history) return;
    try {
      setHistory(await listFn({ data: { sessionId: getSessionId() } }));
    } catch {
      setHistory([]);
    }
  };

  const loadConversation = async (id: string) => {
    setShowHistory(false);
    setLoading(true);
    try {
      const rows = await loadFn({ data: { conversationId: id, sessionId: getSessionId() } });
      setMessages(rows.map((r) => ({ role: r.role, content: r.content, results: r.results })));
      setConversationId(id);
    } catch {
      setError("কথোপকথনটি খোলা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const removeConversation = async (id: string) => {
    try {
      await deleteFn({ data: { conversationId: id, sessionId: getSessionId() } });
      setHistory((h) => (h ?? []).filter((c) => c.id !== id));
      if (conversationId === id) newChat();
    } catch {
      setError("মুছে ফেলা যায়নি।");
    }
  };

  const open = (item: AiSearchResult) => {
    if (item.kind === "business") navigate({ to: "/business/$slug", params: { slug: item.slug || item.id } });
    else if (item.kind === "teacher") navigate({ to: "/teachers/$id", params: { id: item.id } });
    else if (item.kind === "match") navigate({ to: "/match/$id", params: { id: item.id } });
    else if (item.kind === "ukhiya_go") navigate({ to: "/services/ukhiya-go/trip/$tripId", params: { tripId: item.id } });
    else if (item.kind === "reuse") navigate({ to: "/services/reuse/$listingId", params: { listingId: item.id } });
    else if (item.kind === "isp") navigate({ to: "/isp" });
    else if (item.kind === "govt_job") navigate({ to: "/govt-jobs/$id", params: { id: item.id } });
    else navigate({ to: "/blood-donors" });
  };

  return (
    <section className="mx-auto mt-5 max-w-2xl px-4 sm:px-6" aria-label="KHIJIRION AI সহায়ক">
      <div className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-[var(--shadow-lg)]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          {showHistory ? (
            <Button variant="ghost" size="icon-sm" onClick={() => setShowHistory(false)} aria-label="ফিরে যান">
              <ArrowLeft />
            </Button>
          ) : (
            <img src={logo.url} alt="" className="h-9 w-9 rounded-full border border-border object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{showHistory ? "আগের কথোপকথন" : "KHIJIRION AI"}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> অনলাইন · বাংলায় প্রশ্ন করুন
            </p>
          </div>
          {!showHistory && (
            <Button variant="ghost" size="icon-sm" onClick={openHistory} aria-label="আগের কথোপকথন" title="আগের কথোপকথন">
              <History />
            </Button>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={newChat} aria-label="নতুন চ্যাট" title="নতুন চ্যাট">
              <Plus />
            </Button>
          )}
        </div>

        {showHistory ? (
          <div className="max-h-80 min-h-40 overflow-y-auto p-2">
            {history === null ? (
              <div className="p-4"><Shimmer>লোড হচ্ছে…</Shimmer></div>
            ) : history.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">এখনো কোনো কথোপকথন নেই।</p>
            ) : (
              <ul className="space-y-1">
                {history.map((c) => (
                  <li key={c.id} className="flex items-center gap-1 rounded-xl hover:bg-accent">
                    <button
                      type="button"
                      onClick={() => void loadConversation(c.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{c.title || "শিরোনামহীন"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {new Date(c.updated_at).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mr-1 text-muted-foreground hover:text-destructive"
                      onClick={() => void removeConversation(c.id)}
                      aria-label="মুছুন"
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <Conversation className="h-72 sm:h-80">
              <ConversationContent className="gap-4">
                {messages.length === 0 && (
                  <Message from="assistant">
                    <MessageContent>
                      <p className="text-sm">
                        আসসালামু আলাইকুম! আমি KHIJIRION AI। রক্তদাতা, শিক্ষক, দোকান, গাড়ি, ওয়াইফাই — কী খুঁজছেন বলুন।
                      </p>
                    </MessageContent>
                  </Message>
                )}
                {messages.map((m, i) => (
                  <Message key={i} from={m.role}>
                    <MessageContent
                      className={
                        m.role === "user"
                          ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                          : undefined
                      }
                    >
                      {m.role === "assistant" ? <MessageResponse>{m.content}</MessageResponse> : m.content}
                      {m.results && m.results.length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {m.results.map((item) => {
                            const meta = META[item.kind];
                            return (
                              <li key={`${item.kind}-${item.id}`}>
                                <button
                                  type="button"
                                  onClick={() => open(item)}
                                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:border-primary/60"
                                >
                                  <meta.icon className="h-4 w-4 shrink-0 text-primary" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">{item.title}</span>
                                    {item.subtitle && (
                                      <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                                    )}
                                  </span>
                                  <span className="shrink-0 text-xs text-muted-foreground">{meta.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </MessageContent>
                  </Message>
                ))}
                {loading && <Shimmer className="text-sm">খোঁজা হচ্ছে…</Shimmer>}
                {error && <p className="text-sm text-destructive">{error}</p>}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void ask(s)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-border p-3">
              <PromptInput onSubmit={() => void ask(q)}>
                <PromptInputTextarea
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="আপনার প্রশ্ন লিখুন…"
                  aria-label="KHIJIRION AI-কে প্রশ্ন করুন"
                  className="min-h-10"
                />
                <PromptInputFooter className="justify-end">
                  <PromptInputSubmit
                    status={loading ? "submitted" : undefined}
                    disabled={loading || q.trim().length < 2}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
