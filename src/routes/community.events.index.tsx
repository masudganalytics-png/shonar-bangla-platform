import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/community/EventCard";
import { useCommunityProfiles } from "@/components/community/use-community-profiles";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_ICON,
  EVENT_CATEGORY_LABEL_BN,
  type CommunityEventCategory,
  type CommunityEventRow,
} from "@/lib/community-shared";

export const Route = createFileRoute("/community/events/")({
  head: () => ({
    meta: [
      { title: "আজিয়া মেলা হডে — স্থানীয় অনুষ্ঠান | উখিয়া সেবা" },
      {
        name: "description",
        content:
          "উখিয়ার ওয়ালিমা, আকিকা, মিলাদ, ইফতার, খেলা, মেলা ও সামাজিক অনুষ্ঠানের তালিকা। নিজের অনুষ্ঠানও বিনামূল্যে প্রকাশ করুন।",
      },
      { property: "og:title", content: "আজিয়া মেলা হডে — স্থানীয় অনুষ্ঠান" },
      { property: "og:description", content: "এলাকার সব অনুষ্ঠানের খবর এক জায়গায়।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CommunityEventCategory | "all">("all");

  const eventsQ = useQuery({
    queryKey: ["community-events", "all"],
    queryFn: async (): Promise<CommunityEventRow[]> => {
      const { data, error } = await supabase
        .from("community_events")
        .select("*")
        .eq("is_hidden", false)
        .order("event_date", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as CommunityEventRow[];
    },
  });

  const profiles = useCommunityProfiles((eventsQ.data ?? []).map((e) => e.organizer_id));

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (eventsQ.data ?? []).filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (!term) return true;
      return (
        e.title.toLowerCase().includes(term) ||
        (e.area ?? "").toLowerCase().includes(term) ||
        (e.description ?? "").toLowerCase().includes(term)
      );
    });
  }, [eventsQ.data, q, cat]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">🍛 আজিয়া মেলা হডে</h1>
          <p className="mt-1 text-sm text-muted-foreground">এলাকার অনুষ্ঠানের খবর ও আমন্ত্রণ</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/community">কমিউনিটি</Link>
          </Button>
          <Button asChild>
            <Link to="/community/events/new">
              <Plus className="mr-2 h-4 w-4" /> অনুষ্ঠান যোগ করুন
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="অনুষ্ঠান বা এলাকা খুঁজুন"
          className="pl-9"
          aria-label="অনুষ্ঠান সার্চ"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge
          variant={cat === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setCat("all")}
        >
          সব
        </Badge>
        {EVENT_CATEGORIES.map((c) => (
          <Badge
            key={c}
            variant={cat === c ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCat(c)}
          >
            {EVENT_CATEGORY_ICON[c]} {EVENT_CATEGORY_LABEL_BN[c]}
          </Badge>
        ))}
      </div>

      {eventsQ.isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm text-muted-foreground">কোনো অনুষ্ঠান পাওয়া যায়নি।</p>
          <Button asChild className="mt-4">
            <Link to="/community/events/new">অনুষ্ঠান যোগ করুন</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EventCard key={e.id} e={e} organizer={profiles.get(e.organizer_id)} />
          ))}
        </div>
      )}
    </div>
  );
}
