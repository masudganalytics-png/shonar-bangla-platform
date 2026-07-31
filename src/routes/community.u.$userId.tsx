import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getCommunityProfiles, getCommunityUserStats } from "@/lib/community.functions";
import { CommunityCard } from "@/components/community/CommunityCard";
import { EventCard } from "@/components/community/EventCard";
import type { CommunityEventRow, CommunityPublicProfile, CommunityRow } from "@/lib/community-shared";

export const Route = createFileRoute("/community/u/$userId")({
  head: () => ({
    meta: [
      { title: "সদস্য প্রোফাইল — কমিউনিটি | উখিয়া সেবা" },
      { name: "description", content: "কমিউনিটি সদস্যের প্রোফাইল, যুক্ত ক্লাব-গ্রুপ এবং আয়োজিত অনুষ্ঠান দেখুন।" },
      { property: "og:title", content: "সদস্য প্রোফাইল — উখিয়া সেবা" },
      { property: "og:description", content: "কমিউনিটি সদস্যের কার্যক্রম।" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { userId } = useParams({ from: "/community/u/$userId" });

  const profileQ = useQuery({
    queryKey: ["community-profile", userId],
    queryFn: async (): Promise<CommunityPublicProfile | null> => {
      const rows = (await getCommunityProfiles({ data: { ids: [userId] } })) as CommunityPublicProfile[];
      return rows[0] ?? null;
    },
  });

  const statsQ = useQuery({
    queryKey: ["community-user-stats", userId],
    queryFn: async () => await getCommunityUserStats({ data: { userId } }),
  });

  const listsQ = useQuery({
    queryKey: ["community-user-lists", userId],
    queryFn: async () => {
      const [mem, events] = await Promise.all([
        supabase.from("community_members").select("community_id").eq("user_id", userId),
        supabase.from("community_events").select("*").eq("organizer_id", userId).eq("is_hidden", false).order("event_date", { ascending: false }),
      ]);
      const ids = (mem.data ?? []).map((r) => r.community_id);
      let communities: CommunityRow[] = [];
      if (ids.length) {
        const { data } = await supabase.from("communities").select("*").in("id", ids).eq("is_active", true);
        communities = (data ?? []) as CommunityRow[];
      }
      return { communities, events: (events.data ?? []) as CommunityEventRow[] };
    },
  });

  const name = profileQ.data?.full_name?.trim() || "ব্যবহারকারী";

  if (profileQ.isLoading) return <div className="mx-auto max-w-4xl px-4 py-8"><Skeleton className="h-48" /></div>;

  const stats = statsQ.data;
  const groups = (listsQ.data?.communities ?? []).filter((c) => c.kind === "group");
  const others = (listsQ.data?.communities ?? []).filter((c) => c.kind !== "group");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-20 w-20">
            {profileQ.data?.avatar_url ? <AvatarImage src={profileQ.data.avatar_url} alt={name} /> : null}
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{name}</h1>
            {profileQ.data?.area ? <p className="text-sm text-muted-foreground">{profileQ.data.area}</p> : null}
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/community">কমিউনিটি</Link></Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "কমিউনিটি", value: stats?.communities ?? 0 },
            { label: "ক্লাব", value: stats?.clubs ?? 0 },
            { label: "গ্রুপ", value: stats?.groups ?? 0 },
            { label: "অনুষ্ঠান", value: stats?.events ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-3 text-center">
              <div className="text-xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="communities" className="mt-6">
        <TabsList>
          <TabsTrigger value="communities">কমিউনিটি ও ক্লাব</TabsTrigger>
          <TabsTrigger value="groups">গ্রুপ</TabsTrigger>
          <TabsTrigger value="events">অনুষ্ঠান</TabsTrigger>
        </TabsList>
        <TabsContent value="communities" className="mt-4 grid gap-3 sm:grid-cols-2">
          {others.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground sm:col-span-2">কিছু নেই।</Card> : others.map((c) => <CommunityCard key={c.id} c={c} />)}
        </TabsContent>
        <TabsContent value="groups" className="mt-4 grid gap-3 sm:grid-cols-2">
          {groups.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground sm:col-span-2">কিছু নেই।</Card> : groups.map((c) => <CommunityCard key={c.id} c={c} />)}
        </TabsContent>
        <TabsContent value="events" className="mt-4 grid gap-3 sm:grid-cols-2">
          {(listsQ.data?.events ?? []).length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground sm:col-span-2">কোনো অনুষ্ঠান নেই।</Card> : (listsQ.data?.events ?? []).map((e) => <EventCard key={e.id} e={e} organizer={profileQ.data ?? undefined} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
