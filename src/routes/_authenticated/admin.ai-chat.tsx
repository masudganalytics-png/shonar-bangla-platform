import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bot, Trash2, Search, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listAiConversationsAdmin,
  getAiChatStatsAdmin,
  getAiConversationAdmin,
  deleteAiConversationAdmin,
} from "@/lib/ai-chat-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/ai-chat")({
  head: () => ({
    meta: [
      { title: "AI কথোপকথন — অ্যাডমিন" },
      { name: "description", content: "KHIJIRION AI চ্যাট কথোপকথন পর্যবেক্ষণ ও ব্যবস্থাপনা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAiChat,
});

function formatDate(value: string): string {
  return new Date(value).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });
}

function AdminAiChat() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();

  const listFn = useServerFn(listAiConversationsAdmin);
  const statsFn = useServerFn(getAiChatStatsAdmin);
  const messagesFn = useServerFn(getAiConversationAdmin);
  const deleteFn = useServerFn(deleteAiConversationAdmin);

  const { data: stats } = useQuery({
    queryKey: ["admin-ai-chat-stats"],
    queryFn: () => statsFn({ data: undefined }),
  });

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["admin-ai-conversations", search],
    queryFn: () => listFn({ data: { search: search.trim() || undefined } }),
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["admin-ai-conversation", openId],
    queryFn: () => messagesFn({ data: { conversationId: openId as string } }),
    enabled: Boolean(openId),
  });

  const del = useMutation({
    mutationFn: (conversationId: string) => deleteFn({ data: { conversationId } }),
    onSuccess: () => {
      toast.success("কথোপকথন মুছে ফেলা হয়েছে");
      setOpenId(null);
      qc.invalidateQueries({ queryKey: ["admin-ai-conversations"] });
      qc.invalidateQueries({ queryKey: ["admin-ai-chat-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <header>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Bot className="h-5 w-5 text-primary" /> AI কথোপকথন
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          KHIJIRION AI-এর সঙ্গে ব্যবহারকারীদের কথোপকথন দেখুন ও প্রয়োজনে মুছে ফেলুন।
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">মোট কথোপকথন</p>
            <p className="mt-1 text-2xl font-bold">{stats?.conversations ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">মোট বার্তা</p>
            <p className="mt-1 text-2xl font-bold">{stats?.messages ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">সর্বশেষ কার্যক্রম</p>
            <p className="mt-1 text-sm font-medium">
              {stats?.last_activity ? formatDate(stats.last_activity) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="শিরোনাম দিয়ে খুঁজুন…"
          className="pl-9"
          aria-label="কথোপকথন খুঁজুন"
        />
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">লোড হচ্ছে…</p>
      ) : !conversations || conversations.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            এখনো কোনো কথোপকথন নেই।
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {conversations.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium">{c.title ?? "শিরোনামহীন কথোপকথন"}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.account === "user" ? "লগইন করা ব্যবহারকারী" : "অতিথি"} · {c.owner_ref} · {formatDate(c.updated_at)}
                  </p>
                </button>
                <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                  <MessageSquare className="h-3 w-3" /> {c.message_count}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="কথোপকথন মুছুন"
                  disabled={del.isPending}
                  onClick={() => del.mutate(c.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(openId)} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>কথোপকথনের বিস্তারিত</DialogTitle>
          </DialogHeader>
          {loadingMessages ? (
            <p className="py-8 text-center text-sm text-muted-foreground">লোড হচ্ছে…</p>
          ) : (
            <div className="space-y-3">
              {(messages ?? []).map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                        : "max-w-[90%] text-sm leading-relaxed"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {(messages ?? []).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">কোনো বার্তা নেই।</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
