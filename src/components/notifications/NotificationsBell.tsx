import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBanglaDate, toBanglaDigits } from "@/lib/bangla";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const unread = items.filter((n) => !n.is_read).length;

  async function refresh() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) { setItems([]); return; }
    void refresh();
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        void refresh();
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function markAllRead() {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    void refresh();
  }

  async function markOne(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    void refresh();
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="বিজ্ঞপ্তি" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {toBanglaDigits(Math.min(unread, 99))}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">বিজ্ঞপ্তি</span>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unread === 0}>
            <CheckCheck className="mr-1 h-3 w-3" /> সব পঠিত
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">লোড হচ্ছে…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">কোনো বিজ্ঞপ্তি নেই।</div>
          ) : (
            items.map((n) => {
              const Wrap = n.link ? Link : "div";
              const wrapProps = n.link ? { to: n.link as string } : {};
              return (
                <Wrap
                  key={n.id}
                  {...(wrapProps as never)}
                  onClick={() => markOne(n.id)}
                  className={`block border-b px-3 py-2.5 text-sm last:border-0 hover:bg-accent ${!n.is_read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{n.title}</p>
                    {!n.is_read && <Badge className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary p-0" />}
                  </div>
                  {n.body && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatBanglaDate(n.created_at)}</p>
                </Wrap>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
