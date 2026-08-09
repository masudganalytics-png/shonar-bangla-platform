import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Users, Building2, Newspaper, PartyPopper, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { CommunityCard } from "@/components/community/CommunityCard";
import { EventCard } from "@/components/community/EventCard";
import { useCommunityProfiles } from "@/components/community/use-community-profiles";
import type { CommunityEventRow, CommunityRow } from "@/lib/community-shared";
import { EVENT_CATEGORY_LABEL_BN } from "@/lib/community-shared";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "কমিউনিটি — উখিয়া সেবা" },
      {
        name: "description",
        content:
          "উখিয়ার স্থানীয় কমিউনিটি, সোশ্যাল ক্লাব, গ্রুপ ও অনুষ্ঠান এক জায়গায়। ওয়ালিমা, আকিকা, মিলাদ, ইফতার, খেলা ও মেলার খবর জানুন।",
      },
      { property: "og:title", content: "কমিউনিটি — উখিয়া সেবা" },
      { property: "og:description", content: "স্থানীয় ক্লাব, গ্রুপ ও অনুষ্ঠানের কমিউনিটি প্ল্যাটফর্ম।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityHome,
});

const TILES = [
  {
    to: "/community/events" as const,
    icon: PartyPopper,
    emoji: "🍛",
    title: "আজিয়া মেলা হডে",
    desc: "স্থানীয় অনুষ্ঠান দেখুন ও নিজের অনুষ্ঠান প্রকাশ করুন",
  },
  {
    to: "/community/clubs" as const,
    icon: Building2,
    emoji: "🏢",
    title: "সোশ্যাল ক্লাব",
    desc: "এলাকার ক্লাবগুলোতে যোগ দিন",
  },
  {
    to: "/community/groups" as const,
    icon: Users,
    emoji: "👥",
    title: "গ্রুপ",
    desc: "ব্যাচ, বন্ধু ও এলাকার গ্রুপ",
  },
  {
    to: "/community/mosques" as const,
    icon: Building2,
    emoji: "🕌",
    title: "মসজিদ ও সমাজ",
    desc: "মসজিদ কমিটি, সমাজপতি, সদস্য ও দাতাদের তথ্য",
  },
  {
    to: "/community/feed" as const,
    icon: Newspaper,
    emoji: "📰",
    title: "কমিউনিটি ফিড",
    desc: "সব পোস্ট ও অনুষ্ঠান একসাথে",
  },
];

function CommunityHome() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const communitiesQ = useQuery({
    queryKey: ["community-list-home"],
    queryFn: async (): Promise<CommunityRow[]> => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("is_active", true)
        .order("member_count", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data as CommunityRow[];
    },
  });

  const eventsQ = useQuery({
    queryKey: ["community-events", "home"],
    queryFn: async (): Promise<CommunityEventRow[]> => {
      const { data, error } = await supabase
        .from("community_events")
        .select("*")
        .eq("is_hidden", false)
        .order("event_date", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data as CommunityEventRow[];
    },
  });

  const profiles = useCommunityProfiles((eventsQ.data ?? []).map((e) => e.organizer_id));

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    const comms = (communitiesQ.data ?? []).filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.area ?? "").toLowerCase().includes(term) ||
        (c.description ?? "").toLowerCase().includes(term),
    );
    const evs = (eventsQ.data ?? []).filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        (e.area ?? "").toLowerCase().includes(term) ||
        EVENT_CATEGORY_LABEL_BN[e.category].includes(term),
    );
    return { comms, evs };
  }, [q, communitiesQ.data, eventsQ.data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="isolate rounded-3xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">🤝 কমিউনিটি</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">উখিয়ার মানুষ, এক প্ল্যাটফর্মে</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          স্থানীয় ক্লাব ও গ্রুপে যোগ দিন, আশেপাশের অনুষ্ঠানের খবর জানুন এবং নিজের আয়োজন সবাইকে জানান।
        </p>

        <form
          className="mt-5 flex max-w-xl gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="কমিউনিটি, ক্লাব, গ্রুপ, অনুষ্ঠান বা এলাকা খুঁজুন"
              className="pl-9"
              aria-label="কমিউনিটি সার্চ"
            />
          </div>
          <Button type="button" onClick={() => navigate({ to: "/community/new" })}>
            <Plus className="mr-2 h-4 w-4" /> নতুন তৈরি
          </Button>
        </form>
      </section>

      {/* Search results */}
      {results ? (
        <section className="mt-8">
          <h2 className="text-xl font-bold">সার্চ ফলাফল</h2>
          {results.comms.length === 0 && results.evs.length === 0 ? (
            <Card className="mt-4 p-8 text-center text-sm text-muted-foreground">কিছু পাওয়া যায়নি।</Card>
          ) : (
            <div className="mt-4 space-y-6">
              {results.comms.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {results.comms.map((c) => (
                    <CommunityCard key={c.id} c={c} />
                  ))}
                </div>
              ) : null}
              {results.evs.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {results.evs.map((e) => (
                    <EventCard key={e.id} e={e} organizer={profiles.get(e.organizer_id)} />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {/* Four tiles */}
      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-xl">{t.emoji}</div>
              <h3 className="mt-3 text-base font-bold group-hover:text-primary">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                দেখুন <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>
        ))}
      </section>

      {/* Upcoming events */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">আসন্ন অনুষ্ঠান</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/community/events">সব দেখুন</Link>
          </Button>
        </div>
        {eventsQ.isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-60" />
            ))}
          </div>
        ) : (eventsQ.data ?? []).length === 0 ? (
          <Card className="mt-4 p-8 text-center">
            <p className="text-sm text-muted-foreground">এখনো কোনো অনুষ্ঠান যোগ করা হয়নি।</p>
            <Button asChild className="mt-4">
              <Link to="/community/events/new">প্রথম অনুষ্ঠান যোগ করুন</Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(eventsQ.data ?? []).map((e) => (
              <EventCard key={e.id} e={e} organizer={profiles.get(e.organizer_id)} />
            ))}
          </div>
        )}
      </section>

      {/* Popular communities */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">জনপ্রিয় ক্লাব ও গ্রুপ</h2>
        {communitiesQ.isLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        ) : (communitiesQ.data ?? []).length === 0 ? (
          <Card className="mt-4 p-8 text-center">
            <p className="text-sm text-muted-foreground">এখনো কোনো কমিউনিটি তৈরি হয়নি।</p>
            <Button asChild className="mt-4">
              <Link to="/community/new">প্রথম কমিউনিটি তৈরি করুন</Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(communitiesQ.data ?? []).slice(0, 6).map((c) => (
              <CommunityCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
