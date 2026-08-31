import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Loader2, MapPin, Search, Users, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toBanglaDigits } from "@/lib/bangla";
import {
  UKHIYA_GO_TRIP_STATUS_META,
  UKHIYA_GO_VEHICLE_TYPES,
  ukhiyaGoTripTypeLabel,
  type UkhiyaGoTripStatus,
  type UkhiyaGoTripType,
  type UkhiyaGoVehicleType,
} from "@/lib/ukhiya-go-shared";

export const Route = createFileRoute("/services/ukhiya-go/search")({
  head: () => ({
    meta: [
      { title: "ট্রিপ খুঁজুন — UkhiyaGo | KHIJIRION" },
      {
        name: "description",
        content: "উখিয়া, টেকনাফ ও কক্সবাজার রুটে প্রকাশিত ট্রিপ খুঁজুন — গাড়ি, CNG, বাইক, ফেরত ট্রিপ।",
      },
      { property: "og:title", content: "ট্রিপ খুঁজুন — UkhiyaGo" },
      {
        property: "og:description",
        content: "যাত্রার তারিখ ও রুট অনুযায়ী উপলব্ধ গাড়ি ও সিট খুঁজুন।",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: UkhiyaGoSearchPage,
});

type TripRow = {
  id: string;
  vehicle_type: UkhiyaGoVehicleType | null;
  vehicle_label: string | null;
  from_location: string;
  to_location: string;
  trip_type: UkhiyaGoTripType;
  trip_date: string;
  departure_time: string | null;
  available_seats: number;
  booked_seats: number;
  price_per_person: number | null;
  notes: string | null;
  status: UkhiyaGoTripStatus;
};

type Filters = {
  from: string;
  to: string;
  date: string;
  vehicle: string; // "" = all
};

function UkhiyaGoSearchPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [draft, setDraft] = useState<Filters>({ from: "", to: "", date: "", vehicle: "" });
  const [filters, setFilters] = useState<Filters>({ from: "", to: "", date: "", vehicle: "" });

  const tripsQ = useQuery({
    queryKey: ["ukhiya-go", "search", filters],
    queryFn: async (): Promise<TripRow[]> => {
      let q = supabase
        .from("ukhiya_go_trips")
        .select(
          "id,vehicle_type,vehicle_label,from_location,to_location,trip_type,trip_date,departure_time,available_seats,booked_seats,price_per_person,notes,status",
        )
        .in("status", ["published", "full"]);
      q = filters.date
        ? q.eq("trip_date", filters.date)
        : q.gte("trip_date", today);
      q = q
        .order("trip_date", { ascending: true })
        .order("departure_time", { ascending: true })
        .limit(50);
      if (filters.from.trim()) q = q.ilike("from_location", `%${filters.from.trim()}%`);
      if (filters.to.trim()) q = q.ilike("to_location", `%${filters.to.trim()}%`);
      if (filters.vehicle) q = q.eq("vehicle_type", filters.vehicle as UkhiyaGoVehicleType);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TripRow[];
    },
  });
  const trips = useMemo(() => tripsQ.data ?? [], [tripsQ.data]);

  function applyFilters() {
    setFilters({ ...draft });
  }

  function clearFilters() {
    const empty: Filters = { from: "", to: "", date: "", vehicle: "" };
    setDraft(empty);
    setFilters(empty);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/services/ukhiya-go"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> UkhiyaGo
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold sm:text-3xl">🔍 ট্রিপ খুঁজুন</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          রুট, তারিখ ও গাড়ির ধরন অনুযায়ী প্রকাশিত ট্রিপ খুঁজুন।
        </p>
      </header>

      <Card className="mt-5">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="f-from">কোথা থেকে</Label>
            <Input
              id="f-from"
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
              placeholder="যেমন: উখিয়া"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-to">কোথায়</Label>
            <Input
              id="f-to"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              placeholder="যেমন: কক্সবাজার"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-date">তারিখ</Label>
            <Input
              id="f-date"
              type="date"
              min={today}
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>গাড়ির ধরন</Label>
            <Select
              value={draft.vehicle || "all"}
              onValueChange={(v) => setDraft((d) => ({ ...d, vehicle: v === "all" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="সব ধরনের" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব ধরনের</SelectItem>
                {UKHIYA_GO_VEHICLE_TYPES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button className="flex-1" onClick={applyFilters}>
              <Search className="mr-2 h-4 w-4" /> খুঁজুন
            </Button>
            <Button variant="outline" size="icon" onClick={clearFilters} aria-label="ফিল্টার মুছুন">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 space-y-3">
        {tripsQ.isLoading ? (
          <div className="grid place-items-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tripsQ.isError ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-destructive">
              তথ্য আনা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।
            </CardContent>
          </Card>
        ) : trips.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-8 text-center text-sm text-muted-foreground">
              <p>এই ফিল্টারে কোনো প্রকাশিত ট্রিপ পাওয়া যায়নি। অন্য তারিখ বা রুট চেষ্টা করুন।</p>
              <p>
                আপনি চালক হলে নিজেই ট্রিপ পোস্ট করতে পারেন —{" "}
                <Link
                  to="/services/ukhiya-go/driver/register"
                  className="font-medium text-primary underline"
                >
                  🚗 চালক হিসেবে নিবন্ধন করুন
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (

          trips.map((t) => {
            const seatsLeft = Math.max(0, t.available_seats - t.booked_seats);
            return (
              <Link
                key={t.id}
                to="/services/ukhiya-go/trip/$tripId"
                params={{ tripId: t.id }}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        {t.from_location} → {t.to_location}
                        <Badge variant={t.status === "published" ? "default" : "secondary"}>
                          {UKHIYA_GO_TRIP_STATUS_META[t.status].label}
                        </Badge>
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {toBanglaDigits(t.trip_date)}
                          {t.departure_time ? ` · ${toBanglaDigits(t.departure_time.slice(0, 5))}` : ""}
                        </span>
                        <span>{ukhiyaGoTripTypeLabel(t.trip_type)}</span>
                        {t.vehicle_label && <span>{t.vehicle_label}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                      {t.price_per_person != null && (
                        <span className="font-semibold text-primary">
                          ৳{toBanglaDigits(t.price_per_person)}/জন
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {seatsLeft > 0
                          ? `${toBanglaDigits(seatsLeft)} সিট খালি`
                          : "সিট শেষ"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
