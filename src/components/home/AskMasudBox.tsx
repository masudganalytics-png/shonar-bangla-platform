import { useState } from "react";
import { Bot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";

const WELCOME =
  "আসসালামু আলাইকুম! আমি AskMasud, একটি AI সহায়ক। পড়াশোনা, সিভি, আবেদনপত্র, অনুবাদ বা সাধারণ যেকোনো প্রশ্ন করুন। উখিয়ার রক্তদাতা, শিক্ষক বা দোকান খুঁজতে KHIJIRION AI-তে যান।";
const SUGGESTIONS = ["CV লিখতে সাহায্য", "আবেদনপত্র লিখে দিন", "ইংরেজি থেকে বাংলা অনুবাদ", "পড়াশোনার প্রশ্ন"];

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

export function AskMasudBox() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (text: string) => {
    const value = text.trim();
    if (!value || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: value }];
    setMessages(next);
    setQ("");
    setLoading(true);
    const FAIL = "এই মুহূর্তে উত্তর দিতে পারছি না, একটু পরে আবার চেষ্টা করুন।";
    try {
      const history = next.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
      const { data: sess } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sess.session) headers.Authorization = `Bearer ${sess.session.access_token}`;
      const res = await fetch("/api/askmasud", { method: "POST", headers, body: JSON.stringify({ messages: history.slice(-10) }) });
      if (!res.ok || !res.body) {
        const msg = res.status === 429 ? await res.text() : FAIL;
        setMessages((p) => [...p, { role: "assistant", content: msg, error: true }]);
        return;
      }
      setMessages((p) => [...p, { role: "assistant", content: "" }]);
      setLoading(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((p) => [...p.slice(0, -1), { role: "assistant", content: snapshot }]);
      }
      if (!acc.trim()) setMessages((p) => [...p.slice(0, -1), { role: "assistant", content: FAIL, error: true }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: FAIL, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-success/40 bg-card text-card-foreground shadow-[var(--shadow-lg)]">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-success-foreground">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">AskMasud</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success" /> সাধারণ AI সহায়ক
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={loading}>
            <Plus /> নতুন চ্যাট
          </Button>
        )}
      </div>

      <Conversation className="h-72 sm:h-80">
        <ConversationContent className="gap-4">
          {messages.length === 0 && (
            <Message from="assistant">
              <MessageContent>
                <p className="text-sm">{WELCOME}</p>
              </MessageContent>
            </Message>
          )}
          {messages.map((m, i) => (
            <Message key={i} from={m.role}>
              <MessageContent
                className={m.role === "user" ? "group-[.is-user]:bg-success group-[.is-user]:text-success-foreground" : undefined}
              >
                {m.role === "assistant" ? (
                  <div className={m.error ? "text-destructive" : undefined}>
                    <MessageResponse>{m.content}</MessageResponse>
                  </div>
                ) : (
                  m.content
                )}
              </MessageContent>
            </Message>
          ))}
          {loading && <Shimmer className="text-sm">লিখছে…</Shimmer>}
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
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs transition-colors hover:border-success hover:text-success"
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
            placeholder="AskMasud-কে প্রশ্ন করুন…"
            aria-label="AskMasud-কে প্রশ্ন করুন"
            className="min-h-10"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={loading ? "submitted" : undefined} disabled={loading || !q.trim()} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          এটি AI-চালিত উত্তর। আইন, চিকিৎসা, ভিসা বা আর্থিক বিষয়ে সিদ্ধান্ত নেওয়ার আগে যাচাই করুন।
        </p>
      </div>
    </div>
  );
}
