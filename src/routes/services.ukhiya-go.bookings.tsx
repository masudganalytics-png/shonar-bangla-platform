import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Loader2, MapPin, Search, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toBanglaDigits, formatBanglaDate } from "@/lib/bangla";
import {
  UKHIYA_GO_BOOKING_STATUS_META,
  UKHIYA_GO_TRIP_STATUS_META,
  ukhiyaGoTripTypeLabel,
  type UkhiyaGoBookingStatus,
  type UkhiyaGoTripStatus,
} from "@/lib/ukhiya-go-shared";

export const Route = createFileRoute("/services/ukhiya-go/bookings")({
  head: () => ({
    meta: [
      { title: "আমার বুকিং — UkhiyaGo | KHIJIRION" },
      { name: "description", content: "আপনার ট্রিপ বুকিংয়ের তালিকা ও অবস্থা।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyBookingsPage,
});

type BookingRow = {
  id: string;
  trip_id: string;
  seats_booked: number;
  pickup_point: string | null;
  drop_point: string | null;
  note: string | null;
  status: UkhiyaGoBookingStatus;
  created_at: string;
};

type TripInfo = {
  id: string;
  from_location: string;
  to_location: string;
  trip_type: string;
  trip_date: string;
  departure_time: string | null;
  price_per_person: number | null;
  status: UkhiyaGoTripStatus;
};

function friendlyError(err: unknown): string {
  const msg = (err as { message?: string } | null)?.message ?? "";
  if (/invalid_status_change|not_allowed|booking_fields_locked/i.test(msg))
    return "এই বুকিং এখন বাতিল করা যাবে না।";
  if (/row-level security|permission/i.test(msg)) return "অনুমতি নেই। আবার লগইন করুন।";
  if (/network|fetch/i.test(msg)) return "ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  return msg || "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।";
}

function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth", search: { redirect: "/services/ukhiya-go/bookings" } });
    }
  }, [authLoading, user, navigate]);

  const bookingsQ = useQuery({
    queryKey: ["ukhiya-go", "my-bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<BookingRow[]> => {
      const { data, error } = await supabase
        .from("ukhiya_go_bookings")
        .select("id,trip_id,seats_booked,pickup_point,drop_point,note,status,created_at")
        .eq("passenger_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingRow[];
    },
  });
  const bookings = useMemo(() => bookingsQ.data ?? [], [bookingsQ.data]);

  const tripIdsKey = [...new Set(bookings.map((b) => b.trip_id))].sort().join(",");
  const tripsQ = useQuery({
    queryKey: ["ukhiya-go", "my-booking-trips", tripIdsKey],
    enabled: tripIdsKey.length > 0,
    queryFn: async (): Promise<Record<string, TripInfo>> => {
      const ids = tripIdsKey.split(",");
      const { data, error } = await supabase
        .from("ukhiya_go_trips")
        .select("id,from_location,to_location,trip_type,trip_date,departure_time,price_per_person,status")
        .in("id", ids);
      if (error) throw error;
      const map: Record<string, TripInfo> = {};
      for (const t of (data ?? []) as TripInfo[]) map[t.id] = t;
      return map;
    },
  });
  const tripsById = tripsQ.data ?? {};

  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ukhiya_go_bookings")
        .update({ status: "cancelled" as const })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-bookings"] }),
        qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-booking"] }),
      ]);
      toast.success("বুকিং বাতিল করা হয়েছে");
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  if (authLoading || (user && bookingsQ.isLoading)) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/services/ukhiya-go"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> UkhiyaGo
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold sm:text-3xl">🎫 আমার বুকিং</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          আপনার সব ট্রিপ বুকিংয়ের তালিকা ও বর্তমান অবস্থা।
        </p>
      </header>

      <section className="mt-6 space-y-3">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-muted-foreground">আপনার এখনো কোনো বুকিং নেই।</p>
              <Button asChild>
                <Link to="/services/ukhiya-go/search">
                  <Search className="mr-2 h-4 w-4" /> ট্রিপ খুঁজুন
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          bookings.map((b) => {
            const trip = tripsById[b.trip_id];
            const meta = UKHIYA_GO_BOOKING_STATUS_META[b.status];
            const cancellable = b.status === "pending" || b.status === "confirmed";
            return (
              <Card key={b.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      {trip ? (
                        <>
                          {trip.from_location} → {trip.to_location}
                        </>
                      ) : (
                        "ট্রিপের তথ্য উপলব্ধ নেই"
                      )}
                      <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>
                        {meta.label}
                      </Badge>
                      {trip && trip.status !== "published" && trip.status !== "full" && (
                        <Badge variant="outline">{UKHIYA_GO_TRIP_STATUS_META[trip.status].label}</Badge>
                      )}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {trip && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatBanglaDate(trip.trip_date)}
                          {trip.departure_time
                            ? ` · ${toBanglaDigits(trip.departure_time.slice(0, 5))}`
                            : ""}
                        </span>
                      )}
                      {trip && <span>{ukhiyaGoTripTypeLabel(trip.trip_type)}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {toBanglaDigits(b.seats_booked)} সিট
                      </span>
                      {trip?.price_per_person != null && (
                        <span>
                          আনুমানিক ৳{toBanglaDigits(trip.price_per_person * b.seats_booked)}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.pickup_point && <>পিকআপ: {b.pickup_point} · </>}
                      {b.drop_point && <>গন্তব্য: {b.drop_point} · </>}
                      {meta.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {trip && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/services/ukhiya-go/trip/$tripId" params={{ tripId: trip.id }}>
                          ট্রিপ দেখুন
                        </Link>
                      </Button>
                    )}
                    {cancellable && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={cancelBooking.isPending}
                        onClick={() => cancelBooking.mutate(b.id)}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> বাতিল করুন
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
