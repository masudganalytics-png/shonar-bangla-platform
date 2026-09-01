import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Pencil,
  Plus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  UKHIYA_GO_BOOKING_STATUS_META,
  UKHIYA_GO_SERVICE_AREAS,
  UKHIYA_GO_TRIP_STATUS_META,
  UKHIYA_GO_TRIP_TYPES,
  UKHIYA_GO_VEHICLE_TYPES,
  ukhiyaGoTripTypeLabel,
  ukhiyaGoVehicleLabel,
  type UkhiyaGoBookingStatus,
  type UkhiyaGoTripStatus,
  type UkhiyaGoTripType,
  type UkhiyaGoVehicleType,
} from "@/lib/ukhiya-go-shared";

export const Route = createFileRoute("/services/ukhiya-go/driver/")({
  head: () => ({
    meta: [
      { title: "চালক ড্যাশবোর্ড — UkhiyaGo | KHIJIRION" },
      { name: "description", content: "ট্রিপ পোস্ট করুন ও বুকিং অনুরোধ ব্যবস্থাপনা করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DriverDashboardPage,
});

type VehicleRow = {
  id: string;
  vehicle_type: UkhiyaGoVehicleType;
  brand: string | null;
  model: string | null;
  seating_capacity: number | null;
  verification_status: string;
};

type TripRow = {
  id: string;
  vehicle_id: string | null;
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

type BookingRow = {
  id: string;
  trip_id: string;
  passenger_name: string;
  passenger_phone: string;
  seats_booked: number;
  pickup_point: string | null;
  drop_point: string | null;
  note: string | null;
  status: UkhiyaGoBookingStatus;
  created_at: string;
};

type TripForm = {
  vehicle_id: string;
  from_location: string;
  to_location: string;
  trip_type: UkhiyaGoTripType;
  trip_date: string;
  departure_time: string;
  available_seats: string;
  price_per_person: string;
  notes: string;
};

const EMPTY_TRIP: TripForm = {
  vehicle_id: "",
  from_location: "",
  to_location: "",
  trip_type: "regular",
  trip_date: "",
  departure_time: "",
  available_seats: "",
  price_per_person: "",
  notes: "",
};

function friendlyError(err: unknown): string {
  const msg = (err as { message?: string } | null)?.message ?? "";
  if (/not_enough_seats/i.test(msg)) return "পর্যাপ্ত সিট নেই — এই বুকিং গ্রহণ করা যাবে না।";
  if (/trip_not_bookable/i.test(msg)) return "এই ট্রিপে এখন বুকিং নেওয়া যাচ্ছে না।";
  if (/invalid_status_change|not_allowed|booking_fields_locked/i.test(msg))
    return "এই পরিবর্তনের অনুমতি নেই।";
  if (/row-level security|permission/i.test(msg)) return "অনুমতি নেই। আবার লগইন করুন।";
  if (/network|fetch/i.test(msg)) return "ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  return msg || "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।";
}

function DriverDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth", search: { redirect: "/services/ukhiya-go/driver" } });
    }
  }, [authLoading, user, navigate]);

  const driverQ = useQuery({
    queryKey: ["ukhiya-go", "my-driver", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ukhiya_go_drivers")
        .select("id,name,verification_status")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as { id: string; name: string; verification_status: string } | null) ?? null;
    },
  });
  const driver = driverQ.data ?? null;

  const vehiclesQ = useQuery({
    queryKey: ["ukhiya-go", "my-vehicles", driver?.id],
    enabled: !!driver?.id,
    queryFn: async (): Promise<VehicleRow[]> => {
      const { data, error } = await supabase
        .from("ukhiya_go_vehicles")
        .select("id,vehicle_type,brand,model,seating_capacity,verification_status")
        .eq("driver_id", driver!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VehicleRow[];
    },
  });
  const vehicles = useMemo(() => vehiclesQ.data ?? [], [vehiclesQ.data]);

  const tripsQ = useQuery({
    queryKey: ["ukhiya-go", "my-trips", driver?.id],
    enabled: !!driver?.id,
    queryFn: async (): Promise<TripRow[]> => {
      const { data, error } = await supabase
        .from("ukhiya_go_trips")
        .select(
          "id,vehicle_id,vehicle_type,vehicle_label,from_location,to_location,trip_type,trip_date,departure_time,available_seats,booked_seats,price_per_person,notes,status",
        )
        .eq("driver_id", driver!.id)
        .order("trip_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TripRow[];
    },
  });
  const trips = useMemo(() => tripsQ.data ?? [], [tripsQ.data]);

  const tripIdsKey = trips.map((t) => t.id).join(",");
  const bookingsQ = useQuery({
    queryKey: ["ukhiya-go", "my-trip-bookings", tripIdsKey],
    enabled: trips.length > 0,
    queryFn: async (): Promise<BookingRow[]> => {
      const { data, error } = await supabase
        .from("ukhiya_go_bookings")
        .select(
          "id,trip_id,passenger_name,passenger_phone,seats_booked,pickup_point,drop_point,note,status,created_at",
        )
        .in("trip_id", trips.map((t) => t.id))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingRow[];
    },
  });
  const bookings = useMemo(() => bookingsQ.data ?? [], [bookingsQ.data]);

  // ---- trip form (create + edit) ----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripRow | null>(null);
  const [form, setForm] = useState<TripForm>(EMPTY_TRIP);

  function openCreate() {
    setEditingTrip(null);
    setForm({
      ...EMPTY_TRIP,
      trip_date: new Date().toISOString().slice(0, 10),
      vehicle_id: vehicles[0]?.id ?? "",
    });
    setDialogOpen(true);
  }

  function openEdit(t: TripRow) {
    setEditingTrip(t);
    setForm({
      vehicle_id: t.vehicle_id ?? "",
      from_location: t.from_location,
      to_location: t.to_location,
      trip_type: t.trip_type,
      trip_date: t.trip_date,
      departure_time: t.departure_time ? t.departure_time.slice(0, 5) : "",
      available_seats: String(t.available_seats),
      price_per_person: t.price_per_person != null ? String(t.price_per_person) : "",
      notes: t.notes ?? "",
    });
    setDialogOpen(true);
  }

  const saveTrip = useMutation({
    mutationFn: async () => {
      const vehicle = vehicles.find((v) => v.id === form.vehicle_id) ?? null;
      const seats = Number(form.available_seats);
      if (!Number.isFinite(seats) || seats < 1 || seats > 60) {
        throw new Error("সিট সংখ্যা ১ থেকে ৬০ এর মধ্যে দিন");
      }
      if (!form.from_location.trim() || !form.to_location.trim()) {
        throw new Error("যাত্রা শুরু ও গন্তব্য লিখুন");
      }
      if (!form.trip_date) throw new Error("তারিখ নির্বাচন করুন");
      const payload = {
        driver_id: driver!.id,
        vehicle_id: vehicle?.id ?? null,
        vehicle_type: vehicle?.vehicle_type ?? null,
        vehicle_label: vehicle ? ukhiyaGoVehicleLabel(vehicle) : null,
        from_location: form.from_location.trim(),
        to_location: form.to_location.trim(),
        trip_type: form.trip_type,
        trip_date: form.trip_date,
        departure_time: form.departure_time || null,
        available_seats: seats,
        price_per_person: form.price_per_person.trim() ? Number(form.price_per_person) : null,
        notes: form.notes.trim() || null,
      };
      if (editingTrip) {
        const { error } = await supabase
          .from("ukhiya_go_trips")
          .update(payload)
          .eq("id", editingTrip.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ukhiya_go_trips")
          .insert({ ...payload, status: "published" as const });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      setDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-trips"] });
      toast.success(editingTrip ? "ট্রিপ হালনাগাদ হয়েছে" : "ট্রিপ প্রকাশিত হয়েছে");
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  function onTripSubmit(e: FormEvent) {
    e.preventDefault();
    if (!saveTrip.isPending) saveTrip.mutate();
  }

  const setTripStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UkhiyaGoTripStatus }) => {
      const { error } = await supabase
        .from("ukhiya_go_trips")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async (_d, v) => {
      await qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-trips"] });
      toast.success(v.status === "cancelled" ? "ট্রিপ বাতিল হয়েছে" : "ট্রিপ সম্পন্ন হয়েছে");
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  const setBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UkhiyaGoBookingStatus }) => {
      const { error } = await supabase
        .from("ukhiya_go_bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async (_d, v) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-trip-bookings"] }),
        qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-trips"] }),
      ]);
      toast.success(
        v.status === "confirmed"
          ? "বুকিং গ্রহণ করা হয়েছে"
          : v.status === "rejected"
            ? "বুকিং প্রত্যাখ্যান করা হয়েছে"
            : v.status === "completed"
              ? "বুকিং সম্পন্ন হয়েছে"
              : "বুকিং বাতিল হয়েছে",
      );
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  if (authLoading || (user && driverQ.isLoading)) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  if (!driver) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <UserPlus className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-bold">আপনি এখনো চালক হিসেবে নিবন্ধন করেননি</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ট্রিপ পোস্ট করতে আগে চালক ও গাড়ি নিবন্ধন সম্পন্ন করুন।
        </p>
        <Button asChild className="mt-6">
          <Link to="/services/ukhiya-go/driver/register">নিবন্ধন করুন</Link>
        </Button>
      </div>
    );
  }

  const approved = driver.verification_status === "approved";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/services/ukhiya-go"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> UkhiyaGo
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">চালক ড্যাশবোর্ড</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {driver.name} — ট্রিপ পোস্ট করুন ও বুকিং অনুরোধ ব্যবস্থাপনা করুন।
          </p>
        </div>
        <Button onClick={openCreate} disabled={vehicles.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> নতুন ট্রিপ পোস্ট করুন
        </Button>
      </header>

      {vehicles.length === 0 && (
        <Card className="mt-5 border-primary/30">
          <CardContent className="p-4 text-sm text-muted-foreground">
            ট্রিপ পোস্ট করার আগে অন্তত একটি গাড়ি যুক্ত করুন।{" "}
            <Link to="/services/ukhiya-go/driver/register" className="text-primary underline">
              গাড়ি যুক্ত করুন
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="mt-6 space-y-4">
        {tripsQ.isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : trips.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              এখনো কোনো ট্রিপ নেই। উপরের বোতামে ক্লিক করে প্রথম ট্রিপ পোস্ট করুন।
            </CardContent>
          </Card>
        ) : (
          trips.map((t) => {
            const tripBookings = bookings.filter((b) => b.trip_id === t.id);
            const pendingCount = tripBookings.filter((b) => b.status === "pending").length;
            const statusMeta = UKHIYA_GO_TRIP_STATUS_META[t.status];
            const active = t.status === "published" || t.status === "full";
            return (
              <Card key={t.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                        {t.from_location} → {t.to_location}
                        <Badge variant={t.status === "published" ? "default" : "secondary"}>
                          {statusMeta.label}
                        </Badge>
                      </CardTitle>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {t.trip_date}
                          {t.departure_time ? ` · ${t.departure_time.slice(0, 5)}` : ""}
                        </span>
                        <span>{ukhiyaGoTripTypeLabel(t.trip_type)}</span>
                        {t.vehicle_label && <span>{t.vehicle_label}</span>}
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {t.booked_seats}/{t.available_seats} সিট
                        </span>
                        {t.price_per_person != null && <span>৳{t.price_per_person}/জন</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> সম্পাদনা
                      </Button>
                      {active && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setTripStatus.isPending}
                            onClick={() => setTripStatus.mutate({ id: t.id, status: "completed" })}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> সম্পন্ন
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={setTripStatus.isPending}
                            onClick={() => setTripStatus.mutate({ id: t.id, status: "cancelled" })}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" /> বাতিল
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {t.notes && (
                    <p className="mb-3 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                      {t.notes}
                    </p>
                  )}
                  <h3 className="text-sm font-semibold">
                    বুকিং অনুরোধ{pendingCount > 0 ? ` (${pendingCount} টি নতুন)` : ""}
                  </h3>
                  {tripBookings.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">এখনো কোনো বুকিং নেই।</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {tripBookings.map((b) => (
                        <li
                          key={b.id}
                          className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                              {b.passenger_name}
                              <Badge
                                variant={
                                  b.status === "confirmed"
                                    ? "default"
                                    : b.status === "pending"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {UKHIYA_GO_BOOKING_STATUS_META[b.status].label}
                              </Badge>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {b.seats_booked} সিট
                              {b.pickup_point ? ` · পিকআপ: ${b.pickup_point}` : ""}
                              {b.drop_point ? ` · গন্তব্য: ${b.drop_point}` : ""}
                              {b.note ? ` · নোট: ${b.note}` : ""}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <a href={`tel:${b.passenger_phone}`}>
                              <Phone className="mr-1 h-3.5 w-3.5" /> {b.passenger_phone}
                            </a>
                          </Button>
                          {b.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                disabled={setBookingStatus.isPending}
                                onClick={() =>
                                  setBookingStatus.mutate({ id: b.id, status: "confirmed" })
                                }
                              >
                                গ্রহণ
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={setBookingStatus.isPending}
                                onClick={() =>
                                  setBookingStatus.mutate({ id: b.id, status: "rejected" })
                                }
                              >
                                প্রত্যাখ্যান
                              </Button>
                            </>
                          )}
                          {b.status === "confirmed" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={setBookingStatus.isPending}
                                onClick={() =>
                                  setBookingStatus.mutate({ id: b.id, status: "completed" })
                                }
                              >
                                সম্পন্ন
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={setBookingStatus.isPending}
                                onClick={() =>
                                  setBookingStatus.mutate({ id: b.id, status: "cancelled" })
                                }
                              >
                                বাতিল
                              </Button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {/* Trip create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTrip ? "ট্রিপ সম্পাদনা" : "নতুন ট্রিপ পোস্ট করুন"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onTripSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>গাড়ি *</Label>
              <Select
                value={form.vehicle_id}
                onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="গাড়ি নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {ukhiyaGoVehicleLabel(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from">কোথা থেকে *</Label>
                <Input
                  id="from"
                  list="ukhiya-go-areas"
                  value={form.from_location}
                  onChange={(e) => setForm((f) => ({ ...f, from_location: e.target.value }))}
                  placeholder="যেমন: চট্টগ্রাম"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">গন্তব্য *</Label>
                <Input
                  id="to"
                  list="ukhiya-go-areas"
                  value={form.to_location}
                  onChange={(e) => setForm((f) => ({ ...f, to_location: e.target.value }))}
                  placeholder="যেমন: উখিয়া"
                />
              </div>
            </div>
            <datalist id="ukhiya-go-areas">
              {UKHIYA_GO_SERVICE_AREAS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>ট্রিপের ধরন *</Label>
                <Select
                  value={form.trip_type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, trip_type: v as UkhiyaGoTripType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UKHIYA_GO_TRIP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">তারিখ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.trip_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm((f) => ({ ...f, trip_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="time">ছাড়ার সময়</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.departure_time}
                  onChange={(e) => setForm((f) => ({ ...f, departure_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">সিট সংখ্যা *</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={60}
                  value={form.available_seats}
                  onChange={(e) => setForm((f) => ({ ...f, available_seats: e.target.value }))}
                  placeholder="যেমন: ৪"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">ভাড়া (প্রতি জন)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={form.price_per_person}
                  onChange={(e) => setForm((f) => ({ ...f, price_per_person: e.target.value }))}
                  placeholder="৳"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">নোট (ঐচ্ছিক)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="যেমন: কোটবাজার হয়ে যাবে, চামড়ার সিট আছে"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={saveTrip.isPending}>
              {saveTrip.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTrip ? "হালনাগাদ করুন" : "ট্রিপ প্রকাশ করুন"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Keep vehicle types referenced for future filter reuse in this module.
void UKHIYA_GO_VEHICLE_TYPES;
