import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toBanglaDigits, formatBanglaDate } from "@/lib/bangla";
import { getTripDriverContact } from "@/lib/ukhiya-go.functions";
import {
  UKHIYA_GO_BOOKING_STATUS_META,
  UKHIYA_GO_TRIP_STATUS_META,
  isValidBdPhone,
  normalizeUkhiyaGoPhone,
  ukhiyaGoTripTypeLabel,
  type UkhiyaGoBookingStatus,
  type UkhiyaGoTripStatus,
  type UkhiyaGoTripType,
  type UkhiyaGoVehicleType,
} from "@/lib/ukhiya-go-shared";

export const Route = createFileRoute("/services/ukhiya-go/trip/$tripId")({
  head: () => ({
    meta: [
      { title: "ট্রিপের বিবরণ — UkhiyaGo | KHIJIRION" },
      { name: "description", content: "ট্রিপের বিস্তারিত দেখুন ও সিট বুক করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TripDetailsPage,
});

type TripRow = {
  id: string;
  driver_id: string;
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

type MyBooking = {
  id: string;
  seats_booked: number;
  pickup_point: string | null;
  drop_point: string | null;
  status: UkhiyaGoBookingStatus;
  created_at: string;
};

type DriverContact = { driverName: string; phone: string | null; whatsapp: string | null };

type BookingForm = {
  name: string;
  phone: string;
  seats: string;
  pickup: string;
  destination: string;
  note: string;
};

function friendlyError(err: unknown): string {
  const msg = (err as { message?: string } | null)?.message ?? "";
  if (/trip_not_bookable/i.test(msg)) return "এই ট্রিপে এখন বুকিং নেওয়া যাচ্ছে না।";
  if (/invalid_seats/i.test(msg)) return "সিট সংখ্যা সঠিক নয়।";
  if (/forbidden|not_allowed/i.test(msg)) return "বুকিং গৃহীত হলে চালকের নম্বর দেখা যাবে।";
  if (/row-level security|permission/i.test(msg)) return "অনুমতি নেই। আবার লগইন করুন।";
  if (/network|fetch/i.test(msg)) return "ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  return msg || "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।";
}

function TripDetailsPage() {
  const { tripId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchDriverContact = useServerFn(getTripDriverContact);

  const tripQ = useQuery({
    queryKey: ["ukhiya-go", "trip", tripId],
    queryFn: async (): Promise<TripRow | null> => {
      const { data, error } = await supabase
        .from("ukhiya_go_trips")
        .select(
          "id,driver_id,vehicle_type,vehicle_label,from_location,to_location,trip_type,trip_date,departure_time,available_seats,booked_seats,price_per_person,notes,status",
        )
        .eq("id", tripId)
        .maybeSingle();
      if (error) throw error;
      return (data as TripRow | null) ?? null;
    },
  });
  const trip = tripQ.data ?? null;

  const myBookingQ = useQuery({
    queryKey: ["ukhiya-go", "my-booking", tripId, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MyBooking | null> => {
      const { data, error } = await supabase
        .from("ukhiya_go_bookings")
        .select("id,seats_booked,pickup_point,drop_point,status,created_at")
        .eq("trip_id", tripId)
        .eq("passenger_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as MyBooking | null) ?? null;
    },
  });
  const myBooking = myBookingQ.data ?? null;

  const [form, setForm] = useState<BookingForm>({
    name: "",
    phone: "",
    seats: "1",
    pickup: "",
    destination: "",
    note: "",
  });

  const [contact, setContact] = useState<DriverContact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  async function revealContact() {
    setLoadingContact(true);
    try {
      const res = await fetchDriverContact({ data: { tripId } });
      setContact(res);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoadingContact(false);
    }
  }

  const seatsLeft = trip ? Math.max(0, trip.available_seats - trip.booked_seats) : 0;
  const bookable =
    !!trip && (trip.status === "published" || trip.status === "full") && seatsLeft > 0;

  const submitBooking = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("login_required");
      if (!trip) throw new Error("trip_not_found");
      const seats = Number(form.seats);
      if (!Number.isInteger(seats) || seats < 1 || seats > 20) {
        throw new Error("সিট সংখ্যা ১ থেকে ২০ এর মধ্যে দিন");
      }
      if (!form.name.trim()) throw new Error("আপনার নাম লিখুন");
      if (!isValidBdPhone(form.phone)) throw new Error("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
      const { error } = await supabase.from("ukhiya_go_bookings").insert({
        trip_id: trip.id,
        driver_id: trip.driver_id,
        passenger_id: user.id,
        passenger_name: form.name.trim(),
        passenger_phone: normalizeUkhiyaGoPhone(form.phone),
        seats_booked: seats,
        pickup_point: form.pickup.trim() || null,
        drop_point: form.destination.trim() || null,
        note: form.note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-booking", tripId] }),
        qc.invalidateQueries({ queryKey: ["ukhiya-go", "trip", tripId] }),
      ]);
      toast.success("বুকিং অনুরোধ পাঠানো হয়েছে — চালক গ্রহণ করলে জানানো হবে।");
    },
    onError: (err) => {
      const msg = (err as { message?: string } | null)?.message ?? "";
      if (msg === "login_required") {
        void navigate({
          to: "/auth",
          search: { redirect: `/services/ukhiya-go/trip/${tripId}` },
        });
        return;
      }
      toast.error(friendlyError(err));
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      void navigate({
        to: "/auth",
        search: { redirect: `/services/ukhiya-go/trip/${tripId}` },
      });
      return;
    }
    if (!submitBooking.isPending) submitBooking.mutate();
  }

  if (tripQ.isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">ট্রিপটি পাওয়া যায়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ট্রিপটি বাতিল হয়ে গেছে বা আর উপলব্ধ নেই।
        </p>
        <Button asChild className="mt-6">
          <Link to="/services/ukhiya-go/search">অন্য ট্রিপ খুঁজুন</Link>
        </Button>
      </div>
    );
  }

  const statusMeta = UKHIYA_GO_TRIP_STATUS_META[trip.status];
  const bookingMeta = myBooking ? UKHIYA_GO_BOOKING_STATUS_META[myBooking.status] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/services/ukhiya-go/search"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> ট্রিপ খুঁজুন
      </Link>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            {trip.from_location} → {trip.to_location}
            <Badge variant={trip.status === "published" ? "default" : "secondary"}>
              {statusMeta.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatBanglaDate(trip.trip_date)}
              {trip.departure_time ? ` · ${toBanglaDigits(trip.departure_time.slice(0, 5))}` : ""}
            </span>
            <span>{ukhiyaGoTripTypeLabel(trip.trip_type)}</span>
            {trip.vehicle_label && <span>{trip.vehicle_label}</span>}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1 font-medium">
              <Users className="h-3.5 w-3.5 text-primary" />
              {seatsLeft > 0
                ? `${toBanglaDigits(seatsLeft)} সিট খালি (মোট ${toBanglaDigits(trip.available_seats)})`
                : "সব সিট বুকড"}
            </span>
            {trip.price_per_person != null && (
              <span className="font-semibold text-primary">
                ৳{toBanglaDigits(trip.price_per_person)}/জন
              </span>
            )}
          </p>
          {trip.notes && (
            <p className="rounded-md bg-muted p-3 text-muted-foreground">{trip.notes}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {contact ? (
              <>
                {contact.phone && (
                  <Button asChild size="sm">
                    <a href={`tel:${contact.phone}`}>
                      <Phone className="mr-2 h-4 w-4" /> {toBanglaDigits(contact.phone)}
                    </a>
                  </Button>
                )}
                {contact.whatsapp && (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">চালক: {contact.driverName}</span>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={revealContact}
                disabled={loadingContact || !user}
              >
                {loadingContact ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="mr-2 h-4 w-4" />
                )}
                চালকের নম্বর দেখুন
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            গোপনীয়তার জন্য চালকের নম্বর শুধু বুকিং গৃহীত হলে দেখা যায়।
          </p>
        </CardContent>
      </Card>

      {myBooking && myBooking.status !== "cancelled" && myBooking.status !== "rejected" ? (
        <Card className="mt-5 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              আপনার বুকিং
              <Badge variant={myBooking.status === "confirmed" ? "default" : "secondary"}>
                {bookingMeta?.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{bookingMeta?.description}</p>
            <p>
              সিট: {toBanglaDigits(myBooking.seats_booked)}
              {myBooking.pickup_point ? ` · পিকআপ: ${myBooking.pickup_point}` : ""}
              {myBooking.drop_point ? ` · গন্তব্য: ${myBooking.drop_point}` : ""}
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link to="/services/ukhiya-go/bookings">আমার বুকিং দেখুন</Link>
            </Button>
          </CardContent>
        </Card>
      ) : bookable ? (
        <Card className="mt-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">🎫 সিট বুক করুন</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="b-name">আপনার নাম *</Label>
                <Input
                  id="b-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="পুরো নাম"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-phone">মোবাইল নম্বর *</Label>
                <Input
                  id="b-phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-seats">সিট সংখ্যা *</Label>
                <Input
                  id="b-seats"
                  type="number"
                  min={1}
                  max={20}
                  value={form.seats}
                  onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-pickup">পিকআপ পয়েন্ট</Label>
                <Input
                  id="b-pickup"
                  value={form.pickup}
                  onChange={(e) => setForm((f) => ({ ...f, pickup: e.target.value }))}
                  placeholder="যেমন: কোটবাজার স্টেশন"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-destination">গন্তব্য</Label>
                <Input
                  id="b-destination"
                  value={form.destination}
                  onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                  placeholder="যেখানে নামবেন"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="b-note">নোট (ঐচ্ছিক)</Label>
                <Textarea
                  id="b-note"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="চালকের জন্য কোনো বার্তা থাকলে লিখুন"
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full" disabled={submitBooking.isPending || authLoading}>
                  {submitBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  বুকিং অনুরোধ পাঠান
                </Button>
                {!user && !authLoading && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    বুকিং করতে লগইন করা প্রয়োজন — বোতামে চাপ দিলে লগইন পেজে যাবেন।
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-5">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            এই ট্রিপে এখন বুকিং নেওয়া যাচ্ছে না ({statusMeta.label})।
          </CardContent>
        </Card>
      )}
    </div>
  );
}
