import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { searchCommunityCandidates } from "@/lib/community.functions";
import { ClubMemberCard } from "@/components/community/ClubMemberCard";
import type { ClubMembersData } from "@/components/community/use-club-members";
import {
  BADGE_LABEL_BN,
  COMMUNITY_BADGES,
  type CommunityBadge,
  type CommunityPublicProfile,
} from "@/lib/community-shared";

const ALL = "__all__";
const PAGE_SIZE = 24;

/** Searchable, sortable, filterable member directory with lazy loading. */
export function MemberDirectory({
  communityId,
  data,
  profiles,
  phones,
  canManage,
  onManage,
}: {
  communityId: string;
  data: ClubMembersData;
  profiles: Map<string, CommunityPublicProfile>;
  phones: Record<string, string>;
  canManage: boolean;
  onManage: (userId: string) => void;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "join">("join");
  const [badgeFilter, setBadgeFilter] = useState<string>(ALL);
  const [positionFilter, setPositionFilter] = useState<string>(ALL);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const badgeMap = useMemo(() => {
    const m = new Map<string, CommunityBadge[]>();
    for (const b of data.badges) m.set(b.user_id, [...(m.get(b.user_id) ?? []), b.badge]);
    return m;
  }, [data.badges]);

  const positionName = (id: string | null) => data.positions.find((p) => p.id === id)?.name_bn ?? null;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = data.members.filter((m) => {
      if (term && !(profiles.get(m.user_id)?.full_name ?? "").toLowerCase().includes(term)) return false;
      if (badgeFilter !== ALL && !(badgeMap.get(m.user_id) ?? []).includes(badgeFilter as CommunityBadge)) return false;
      if (positionFilter !== ALL && m.position_id !== positionFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) =>
      sort === "name"
        ? (profiles.get(a.user_id)?.full_name ?? "").localeCompare(profiles.get(b.user_id)?.full_name ?? "", "bn")
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return list;
  }, [data.members, profiles, q, sort, badgeFilter, positionFilter, badgeMap]);

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="নাম দিয়ে খুঁজুন"
              aria-label="সদস্য খুঁজুন"
              className="pl-8"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as "name" | "join")}>
            <SelectTrigger aria-label="সাজানোর ধরন"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="join">যোগদানের তারিখ অনুসারে</SelectItem>
              <SelectItem value="name">নাম অনুসারে</SelectItem>
            </SelectContent>
          </Select>
          <Select value={badgeFilter} onValueChange={setBadgeFilter}>
            <SelectTrigger aria-label="ব্যাজ ফিল্টার"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব ব্যাজ</SelectItem>
              {COMMUNITY_BADGES.map((b) => (
                <SelectItem key={b} value={b}>{BADGE_LABEL_BN[b]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger aria-label="পদ ফিল্টার"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব পদ</SelectItem>
              {data.positions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name_bn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage ? (
          <div className="mt-2 flex justify-end">
            <AddMemberDialog communityId={communityId} onAdded={() => void qc.invalidateQueries({ queryKey: ["club-members", communityId] })} />
          </div>
        ) : null}
      </Card>

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">কোনো সদস্য পাওয়া যায়নি।</Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.slice(0, visible).map((m) => (
            <ClubMemberCard
              key={m.user_id}
              member={m}
              profile={profiles.get(m.user_id)}
              positionName={positionName(m.position_id)}
              badges={badgeMap.get(m.user_id) ?? []}
              {...(phones[m.user_id] ? { phone: phones[m.user_id] } : {})}
              canManage={canManage}
              onManage={onManage}
            />
          ))}
        </div>
      )}

      {rows.length > visible ? (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            আরও দেখুন
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AddMemberDialog({ communityId, onAdded }: { communityId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; full_name: string | null; avatar_url: string | null }>>([]);

  const search = async () => {
    if (q.trim().length < 2) return;
    setBusy(true);
    try {
      setResults(
        (await searchCommunityCandidates({ data: { communityId, q: q.trim() } })) as Array<{
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }>,
      );
    } catch {
      toast.error("খোঁজা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  const add = async (userId: string) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: communityId, user_id: userId, role: "member" });
      if (error) throw error;
      toast.success("সদস্য যোগ হয়েছে");
      onAdded();
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message || "যোগ করা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="mr-1.5 h-4 w-4" /> সদস্য যোগ করুন
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>সদস্য যোগ করুন</DialogTitle>
          <DialogDescription>নিবন্ধিত ব্যবহারকারীর নাম দিয়ে খুঁজুন।</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="member-search">নাম</Label>
            <div className="flex gap-2">
              <Input id="member-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম লিখুন" />
              <Button onClick={() => void search()} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={busy}
                onClick={() => void add(r.id)}
                className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full object-cover" /> : (r.full_name || "ব").slice(0, 1)}
                </span>
                <span className="truncate">{r.full_name || "ব্যবহারকারী"}</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
