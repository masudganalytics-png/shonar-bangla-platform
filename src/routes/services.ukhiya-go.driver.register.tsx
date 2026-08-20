import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, CheckCircle2, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  UKHIYA_GO_SERVICES,
  UKHIYA_GO_SERVICE_AREAS,
  UKHIYA_GO_STATUS_META,
  UKHIYA_GO_VEHICLE_TYPES,
  isValidBdPhone,
  normalizeUkhiyaGoPhone,
  type UkhiyaGoVehicleType,
  type UkhiyaGoVerificationStatus,
} from "@/lib/ukhiya-go-shared";

export const Route = createFileRoute("/services/ukhiya-go/driver/register")({
  head: () => ({
    meta: [
      { title: "চালক ও গাড়ি নিবন্ধন — UkhiyaGo | KHIJIRION" },
      {
        name: "description",
        content:
          "UkhiyaGo-তে চালক হিসেবে নিবন্ধন করুন এবং আপনার গাড়ি যুক্ত করে উখিয়ার যাত্রীদের সেবা দিন।",
      },
      { property: "og:title", content: "চালক ও গাড়ি নিবন্ধন — UkhiyaGo" },
      { property: "og:description", content: "গাড়ি আছে? UkhiyaGo-তে যুক্ত হয়ে আয় করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DriverRegisterPage,
});

type DriverRow = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  profile_photo: string | null;
  address: string | null;
  experience_years: number | null;
  bio: string | null;
  service_areas: string[];
  services: string[];
  verification_status: UkhiyaGoVerificationStatus;
};

type VehicleRow = {
  id: string;
  vehicle_type: UkhiyaGoVehicleType;
  brand: string | null;
  model: string | null;
  registration_number: string | null;
  seating_capacity: number | null;
  photos: string[];
  verification_status: UkhiyaGoVerificationStatus;
};

type DriverForm = {
  name: string;
  profile_photo: string;
  phone: string;
  whatsapp: string;
  address: string;
  experience_years: string;
  bio: string;
  service_areas: string[];
  services: string[];
  consent: boolean;
};

const EMPTY_DRIVER: DriverForm = {
  name: "",
  profile_photo: "",
  phone: "",
  whatsapp: "",
  address: "",
  experience_years: "",
  bio: "",
  service_areas: [],
  services: [],
  consent: false,
};

type VehicleForm = {
  vehicle_type: UkhiyaGoVehicleType;
  brand: string;
  model: string;
  registration_number: string;
  seating_capacity: string;
  photos: string[];
};

const EMPTY_VEHICLE: VehicleForm = {
  vehicle_type: "car",
  brand: "",
  model: "",
  registration_number: "",
  seating_capacity: "",
  photos: [],
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function friendlyError(err: unknown): string {
  const msg = (err as { message?: string } | null)?.message ?? "";
  if (/duplicate key|unique/i.test(msg)) return "এই অ্যাকাউন্টে ইতিমধ্যে একটি চালক প্রোফাইল আছে।";
  if (/row-level security|permission/i.test(msg)) return "এই তথ্য সংরক্ষণের অনুমতি নেই। আবার লগইন করুন।";
  if (/network|fetch/i.test(msg)) return "ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  return msg || "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।";
}

function StatusBadge({ status }: { status: UkhiyaGoVerificationStatus }) {
  const meta = UKHIYA_GO_STATUS_META[status];
  return (
    <Badge variant={status === "approved" ? "default" : "secondary"}>{meta.label}</Badge>
  );
}

function DriverRegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth", search: { redirect: "/services/ukhiya-go/driver/register" } });
    }
  }, [authLoading, user, navigate]);

  const driverQ = useQuery({
    queryKey: ["ukhiya-go", "my-driver", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<DriverRow | null> => {
      const { data, error } = await supabase
        .from("ukhiya_go_drivers")
        .select(
          "id,name,phone,whatsapp,profile_photo,address,experience_years,bio,service_areas,services,verification_status",
        )
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as DriverRow | null) ?? null;
    },
  });

  const driver = driverQ.data ?? null;

  const vehiclesQ = useQuery({
    queryKey: ["ukhiya-go", "my-vehicles", driver?.id],
    enabled: !!driver?.id,
    queryFn: async (): Promise<VehicleRow[]> => {
      const { data, error } = await supabase
        .from("ukhiya_go_vehicles")
        .select(
          "id,vehicle_type,brand,model,registration_number,seating_capacity,photos,verification_status",
        )
        .eq("driver_id", driver!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VehicleRow[];
    },
  });

  const [form, setForm] = useState<DriverForm>(EMPTY_DRIVER);
  const [errors, setErrors] = useState<Partial<Record<keyof DriverForm, string>>>({});
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!driver || loadedId === driver.id) return;
    setLoadedId(driver.id);
    setForm({
      name: driver.name,
      profile_photo: driver.profile_photo ?? "",
      phone: driver.phone,
      whatsapp: driver.whatsapp ?? "",
      address: driver.address ?? "",
      experience_years: driver.experience_years != null ? String(driver.experience_years) : "",
      bio: driver.bio ?? "",
      service_areas: driver.service_areas ?? [],
      services: driver.services ?? [],
      consent: true,
    });
  }, [driver, loadedId]);

  const set = <K extends keyof DriverForm>(k: K, v: DriverForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function uploadPhoto(file: File | null, onDone: (url: string) => void, folder: string) {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const { uploadImageToCloudinary } = await import("@/lib/cloudinary");
      const url = await uploadImageToCloudinary(file, `ukhiya-seba/ukhiya-go/${folder}/${user.id}`);
      onDone(url);
      toast.success("ছবি আপলোড হয়েছে");
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof DriverForm, string>> = {};
    if (form.name.trim().length < 2) next.name = "পূর্ণ নাম লিখুন";
    if (!isValidBdPhone(form.phone)) next.phone = "সঠিক মোবাইল নম্বর দিন (যেমন ০১৭XXXXXXXX)";
    if (form.whatsapp.trim() && !isValidBdPhone(form.whatsapp))
      next.whatsapp = "সঠিক হোয়াটসঅ্যাপ নম্বর দিন";
    if (form.experience_years.trim()) {
      const n = Number(form.experience_years);
      if (!Number.isFinite(n) || n < 0 || n > 60) next.experience_years = "০ থেকে ৬০ এর মধ্যে দিন";
    }
    if (form.service_areas.length === 0) next.service_areas = "অন্তত একটি সেবা এলাকা নির্বাচন করুন";
    if (form.services.length === 0) next.services = "অন্তত একটি সেবা নির্বাচন করুন";
    if (!form.consent) next.consent = "তথ্য প্রকাশে সম্মতি দিন";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const saveDriver = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        name: form.name.trim(),
        profile_photo: form.profile_photo.trim() || null,
        phone: normalizeUkhiyaGoPhone(form.phone),
        whatsapp: form.whatsapp.trim() ? normalizeUkhiyaGoPhone(form.whatsapp) : null,
        address: form.address.trim() || null,
        experience_years: form.experience_years.trim() ? Number(form.experience_years) : null,
        bio: form.bio.trim() || null,
        service_areas: form.service_areas,
        services: form.services,
      };
      if (driver) {
        const { error } = await supabase
          .from("ukhiya_go_drivers")
          .update(payload)
          .eq("id", driver.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ukhiya_go_drivers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      setJustSaved(true);
      await qc.invalidateQueries({ queryKey: ["ukhiya-go"] });
      toast.success(
        driver
          ? "তথ্য হালনাগাদ হয়েছে — পুনরায় যাচাইয়ের অপেক্ষায়"
          : "আপনার নিবন্ধন সফলভাবে জমা হয়েছে। অনুমোদনের পর প্রোফাইলটি প্রকাশিত হবে।",
      );
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saveDriver.isPending) return;
    if (!validate()) {
      toast.error("ফর্মে কিছু তথ্য ঠিক করতে হবে");
      return;
    }
    saveDriver.mutate();
  }

  // ---- vehicle ----
  const [vForm, setVForm] = useState<VehicleForm>(EMPTY_VEHICLE);
  const [vErrors, setVErrors] = useState<Partial<Record<keyof VehicleForm, string>>>({});
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  const saveVehicle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ukhiya_go_vehicles").insert({
        driver_id: driver!.id,
        vehicle_type: vForm.vehicle_type,
        brand: vForm.brand.trim() || null,
        model: vForm.model.trim() || null,
        registration_number: vForm.registration_number.trim().toUpperCase() || null,
        seating_capacity: vForm.seating_capacity.trim() ? Number(vForm.seating_capacity) : null,
        photos: vForm.photos,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setVForm(EMPTY_VEHICLE);
      setShowVehicleForm(false);
      await qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-vehicles"] });
      toast.success("গাড়ি যুক্ত হয়েছে — যাচাইয়ের অপেক্ষায়");
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ukhiya_go_vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ukhiya-go", "my-vehicles"] });
      toast.success("গাড়ি মুছে ফেলা হয়েছে");
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  function onVehicleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saveVehicle.isPending) return;
    const next: Partial<Record<keyof VehicleForm, string>> = {};
    const existing = vehiclesQ.data ?? [];
    const reg = vForm.registration_number.trim().toUpperCase();
    if (reg && existing.some((v) => (v.registration_number ?? "").toUpperCase() === reg)) {
      next.registration_number = "এই রেজিস্ট্রেশন নম্বরের গাড়ি ইতিমধ্যে যুক্ত আছে";
    }
    if (vForm.seating_capacity.trim()) {
      const n = Number(vForm.seating_capacity);
      if (!Number.isFinite(n) || n < 1 || n > 60) next.seating_capacity = "১ থেকে ৬০ এর মধ্যে দিন";
    }
    setVErrors(next);
    if (Object.keys(next).length > 0) return;
    saveVehicle.mutate();
  }

  if (authLoading || (user && driverQ.isLoading)) {
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
        <Badge variant="secondary" className="mb-2">
          UkhiyaGo by KHIJIRION
        </Badge>
        <h1 className="text-2xl font-bold sm:text-3xl">চালক ও গাড়ি নিবন্ধন</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          তথ্য জমা দেওয়ার পর আমাদের টিম যাচাই করবে। যাচাই শেষ হলে আপনার প্রোফাইল প্রকাশিত হবে।
        </p>
      </header>

      {driver && (
        <Card className="mt-5 border-primary/30">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <BadgeCheck className="h-5 w-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                বর্তমান অবস্থা: <StatusBadge status={driver.verification_status} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {UKHIYA_GO_STATUS_META[driver.verification_status].description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {justSaved && !driver && (
        <Card className="mt-5 border-primary/40">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
            <p className="text-sm">
              আপনার নিবন্ধন সফলভাবে জমা হয়েছে। অনুমোদনের পর প্রোফাইলটি প্রকাশিত হবে।
            </p>
          </CardContent>
        </Card>
      )}

      {/* Driver form */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">চালকের তথ্য</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">পূর্ণ নাম *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="যেমন: মোহাম্মদ রফিক"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>প্রোফাইল ছবি</Label>
              <div className="flex items-center gap-3">
                {form.profile_photo ? (
                  <img
                    src={form.profile_photo}
                    alt="চালকের প্রোফাইল ছবি"
                    className="h-16 w-16 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-xs text-muted-foreground">
                    ছবি
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  ছবি আপলোড
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      void uploadPhoto(e.target.files?.[0] ?? null, (u) => set("profile_photo", u), "drivers")
                    }
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">মোবাইল নম্বর *</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">হোয়াটসঅ্যাপ নম্বর</Label>
                <Input
                  id="whatsapp"
                  inputMode="tel"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
                {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">ঠিকানা</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="যেমন: কোটবাজার, উখিয়া"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp">ড্রাইভিং অভিজ্ঞতা (বছর)</Label>
              <Input
                id="exp"
                inputMode="numeric"
                value={form.experience_years}
                onChange={(e) => set("experience_years", e.target.value)}
                placeholder="যেমন: 5"
              />
              {errors.experience_years && (
                <p className="text-xs text-destructive">{errors.experience_years}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>সেবা এলাকা *</Label>
              <div className="flex flex-wrap gap-2">
                {UKHIYA_GO_SERVICE_AREAS.map((area) => {
                  const active = form.service_areas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => set("service_areas", toggle(form.service_areas, area))}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-accent"
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
              {errors.service_areas && (
                <p className="text-xs text-destructive">{errors.service_areas}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>যেসব সেবা দিতে চান *</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {UKHIYA_GO_SERVICES.map((s) => (
                  <label
                    key={s.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={form.services.includes(s.value)}
                      onCheckedChange={() => set("services", toggle(form.services, s.value))}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
              {errors.services && <p className="text-xs text-destructive">{errors.services}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">সংক্ষিপ্ত পরিচিতি</Label>
              <Textarea
                id="bio"
                rows={3}
                maxLength={600}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="আপনার সেবা সম্পর্কে সংক্ষেপে লিখুন"
              />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.consent}
                onCheckedChange={(c) => set("consent", c === true)}
                className="mt-0.5"
              />
              <span>
                আমি নিশ্চিত করছি যে দেওয়া তথ্য সঠিক এবং যাচাইয়ের জন্য KHIJIRION-কে অনুমতি দিচ্ছি।
              </span>
            </label>
            {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={saveDriver.isPending || uploading}>
              {saveDriver.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> জমা হচ্ছে...
                </>
              ) : driver ? (
                "তথ্য হালনাগাদ করুন"
              ) : (
                "নিবন্ধন জমা দিন"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Vehicles */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">আমার গাড়ি</CardTitle>
          {driver && !showVehicleForm && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowVehicleForm(true)}>
              <Plus className="mr-1 h-4 w-4" /> গাড়ি যুক্ত করুন
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!driver && (
            <p className="text-sm text-muted-foreground">
              গাড়ি যুক্ত করতে প্রথমে চালকের তথ্য জমা দিন।
            </p>
          )}

          {driver && (vehiclesQ.data ?? []).length > 0 && (
            <div className="space-y-3">
              {(vehiclesQ.data ?? []).map((v) => (
                <div key={v.id} className="flex items-start gap-3 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {UKHIYA_GO_VEHICLE_TYPES.find((t) => t.value === v.vehicle_type)?.label ??
                        v.vehicle_type}
                      {v.brand ? ` · ${v.brand}` : ""}
                      {v.model ? ` ${v.model}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {v.registration_number ? `রেজিঃ ${v.registration_number} · ` : ""}
                      {v.seating_capacity ? `আসন: ${v.seating_capacity}` : "আসন সংখ্যা দেওয়া হয়নি"}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={v.verification_status} />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="গাড়ি মুছুন"
                    onClick={() => deleteVehicle.mutate(v.id)}
                    disabled={deleteVehicle.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {driver && showVehicleForm && (
            <>
              <Separator />
              <form onSubmit={onVehicleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>গাড়ির ধরন *</Label>
                    <Select
                      value={vForm.vehicle_type}
                      onValueChange={(v) =>
                        setVForm((f) => ({ ...f, vehicle_type: v as UkhiyaGoVehicleType }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UKHIYA_GO_VEHICLE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seat">আসন সংখ্যা</Label>
                    <Input
                      id="seat"
                      inputMode="numeric"
                      value={vForm.seating_capacity}
                      onChange={(e) =>
                        setVForm((f) => ({ ...f, seating_capacity: e.target.value }))
                      }
                      placeholder="যেমন: 4"
                    />
                    {vErrors.seating_capacity && (
                      <p className="text-xs text-destructive">{vErrors.seating_capacity}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">ব্র্যান্ড</Label>
                    <Input
                      id="brand"
                      value={vForm.brand}
                      onChange={(e) => setVForm((f) => ({ ...f, brand: e.target.value }))}
                      placeholder="যেমন: Toyota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">মডেল</Label>
                    <Input
                      id="model"
                      value={vForm.model}
                      onChange={(e) => setVForm((f) => ({ ...f, model: e.target.value }))}
                      placeholder="যেমন: Noah 2015"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg">রেজিস্ট্রেশন নম্বর</Label>
                  <Input
                    id="reg"
                    value={vForm.registration_number}
                    onChange={(e) =>
                      setVForm((f) => ({ ...f, registration_number: e.target.value }))
                    }
                    placeholder="যেমন: COX-GA-11-1234"
                  />
                  {vErrors.registration_number && (
                    <p className="text-xs text-destructive">{vErrors.registration_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>গাড়ির ছবি</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    {vForm.photos.map((p) => (
                      <div key={p} className="relative">
                        <img
                          src={p}
                          alt="গাড়ির ছবি"
                          className="h-16 w-24 rounded-md object-cover"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          aria-label="ছবি সরান"
                          onClick={() =>
                            setVForm((f) => ({ ...f, photos: f.photos.filter((x) => x !== p) }))
                          }
                          className="absolute -right-2 -top-2 rounded-full bg-background p-1 shadow"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      ছবি যোগ করুন
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          void uploadPhoto(
                            e.target.files?.[0] ?? null,
                            (u) => setVForm((f) => ({ ...f, photos: [...f.photos, u] })),
                            "vehicles",
                          )
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saveVehicle.isPending || uploading}>
                    {saveVehicle.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> জমা হচ্ছে...
                      </>
                    ) : (
                      "গাড়ি সংরক্ষণ করুন"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowVehicleForm(false);
                      setVForm(EMPTY_VEHICLE);
                      setVErrors({});
                    }}
                  >
                    বাতিল
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        যাচাই সংক্রান্ত সিদ্ধান্ত কেবল KHIJIRION টিম নিতে পারে। নিজের প্রোফাইল নিজে অনুমোদন করা যায় না।
      </p>
    </div>
  );
}
