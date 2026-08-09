import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listRecentMosques } from "@/lib/mosque.functions";
import { mosquePath } from "@/lib/mosque-shared";

export function MosqueSociety() {
  const fetchRecent = useServerFn(listRecentMosques);
  const q = useQuery({ queryKey: ["mosques-recent-home"], queryFn: () => fetchRecent() });
  const rows = q.data ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Card className="gold-hover rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold sm:text-2xl">🕌 মসজিদ ও সমাজ</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              আপনার এলাকার মসজিদ, সমাজপতি, সমাজের সদস্য ও দাতা-সহযোগীদের তথ্য দেখুন।
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/community/mosques">মসজিদ খুঁজুন</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/community/mosques">সমাজ খুঁজুন</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link to="/community/mosques/new">তথ্য যোগ করুন</Link>
              </Button>
            </div>
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((m) => (
              <Link key={m.id} to="/community/mosques/$slug" params={{ slug: mosquePath(m) }} className="group">
                <div className="h-full rounded-xl border p-3 transition-colors group-hover:border-primary">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug group-hover:text-primary">{m.name}</p>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  </div>
                  <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {[m.area, m.union_name, m.upazila].filter(Boolean).join(", ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}
