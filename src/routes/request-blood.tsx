import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Droplet, Loader2, MapPin, Phone, MessageCircle, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  BLOOD_GROUPS,
  formatBanglaDate,
  normalizePhone,
  type BloodRequestRow,
} from "@/lib/blood-shared";

export const Route = createFileRoute("/request-blood")({
  head: () => ({
    meta: [
      { title: "রক্তের জরুরি অনুরোধ — উখিয়া সেবা" },
      {
        name: "description",
        content:
          "রোগীর জন্য রক্তের প্রয়োজনে জরুরি অনুরোধ পাঠান। প্রশাসক অনুমোদনের পর দাতাদের কাছে পৌঁছাবে।",
      },
      { property: "og:title", content: "রক্তের জরুরি অনুরোধ — উখিয়া সেবা" },
      {
        property: "og:description",
        content: "উখিয়ার দাতাদের কাছে রক্তের জরুরি অনুরোধ পাঠান।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestBloodPage,
});

const schema = z.object({
  patient_name: z.string().trim().min(2, "রোগীর নাম আবশ্যক").max(80),
  blood_group: z.enum(BLOOD_GROUPS, { message: "রক্তের গ্রুপ নির্বাচন করুন" }),
  bags_needed: z.number().int().min(1).max(20),
  hospital_name: z.string().trim().min(2, "হাসপাতালের নাম আবশ্যক").max(120),
  hospital_location: z.string().trim().max(200).optional().or(z.literal("")),
  required_date: z.string().min(1, "তারিখ নির্বাচন করুন"),
  required_time: z.string().trim().max(40).optional().or(z.literal("")),
  contact_person: z.string().trim().min(2, "যোগাযোগ ব্যক্তির নাম আবশ্যক").max(80),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "সঠিক ফোন নম্বর দিন"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, "সঠিক WhatsApp নম্বর দিন")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

function RequestBloodPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    patient_name: "",
    blood_group: "",
    bags_needed: "1",
    hospital_name: "",
    hospital_location: "",
    required_date: "",
    required_time: "",
    contact_person: "",
    phone: "",
    whatsapp: "",
    notes: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const approvedQ = useQuery({
    queryKey: ["blood-requests-approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blood_requests")
        .select("*")
        .eq("status", "approved")
        .order("required_date", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as BloodRequestRow[];
    },
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      phone: normalizePhone(form.phone),
      whatsapp: form.whatsapp ? normalizePhone(form.whatsapp) : "",
      bags_needed: Number(form.bags_needed),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ফর্ম যাচাই করুন");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("blood_requests").insert({
        requester_id: user?.id ?? null,
        patient_name: parsed.data.patient_name,
        blood_group: parsed.data.blood_group,
        bags_needed: parsed.data.bags_needed,
        hospital_name: parsed.data.hospital_name,
        hospital_location: parsed.data.hospital_location || null,
        required_date: parsed.data.required_date,
        required_time: parsed.data.required_time || null,
        contact_person: parsed.data.contact_person,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp || null,
        notes: parsed.data.notes || null,
        status: "pending",
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message || "অনুরোধ পাঠানো যায়নি");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> হোম
      </Link>
      <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
        <Droplet className="h-6 w-6 fill-red-600 text-red-600" /> 🩸 রক্তের জরুরি অনুরোধ
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        সঠিক তথ্য দিয়ে অনুরোধ পাঠান। প্রশাসক অনুমোদনের পর এটি পাবলিক তালিকায় দেখা যাবে।
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {done ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                <h2 className="mt-4 text-xl font-bold">অনুরোধ পাঠানো হয়েছে</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  প্রশাসকের অনুমোদনের পর দাতাদের কাছে পৌঁছানো হবে।
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <Button asChild variant="outline">
                    <Link to="/blood-donors">দাতা দেখুন</Link>
                  </Button>
                  <Button
                    onClick={() => {
                      setDone(false);
                      setForm({
                        patient_name: "",
                        blood_group: "",
                        bags_needed: "1",
                        hospital_name: "",
                        hospital_location: "",
                        required_date: "",
                        required_time: "",
                        contact_person: "",
                        phone: "",
                        whatsapp: "",
                        notes: "",
                      });
                    }}
                  >
                    আরেকটি অনুরোধ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5">
                <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>রোগীর নাম *</Label>
                    <Input
                      value={form.patient_name}
                      onChange={(e) => update("patient_name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>প্রয়োজনীয় রক্তের গ্রুপ *</Label>
                    <Select
                      value={form.blood_group}
                      onValueChange={(v) => update("blood_group", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ব্যাগ সংখ্যা *</Label>
                    <Input
                      value={form.bags_needed}
                      onChange={(e) =>
                        update("bags_needed", e.target.value.replace(/\D/g, "") || "1")
                      }
                      inputMode="numeric"
                      required
                    />
                  </div>

                  <div>
                    <Label>হাসপাতালের নাম *</Label>
                    <Input
                      value={form.hospital_name}
                      onChange={(e) => update("hospital_name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>হাসপাতালের ঠিকানা</Label>
                    <Input
                      value={form.hospital_location}
                      onChange={(e) => update("hospital_location", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>প্রয়োজনের তারিখ *</Label>
                    <Input
                      type="date"
                      value={form.required_date}
                      onChange={(e) => update("required_date", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>প্রয়োজনের সময়</Label>
                    <Input
                      value={form.required_time}
                      onChange={(e) => update("required_time", e.target.value)}
                      placeholder="সকাল ১০টা"
                    />
                  </div>

                  <div>
                    <Label>যোগাযোগ ব্যক্তির নাম *</Label>
                    <Input
                      value={form.contact_person}
                      onChange={(e) => update("contact_person", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>মোবাইল নম্বর *</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      inputMode="tel"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>WhatsApp নম্বর</Label>
                    <Input
                      value={form.whatsapp}
                      onChange={(e) => update("whatsapp", e.target.value)}
                      inputMode="tel"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>অতিরিক্ত মন্তব্য</Label>
                    <Textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </div>

                  <div className="col-span-full flex justify-end gap-2 pt-2">
                    <Button asChild variant="outline">
                      <Link to="/">বাতিল</Link>
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      অনুরোধ পাঠান
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-3">
          <h2 className="text-lg font-semibold">অনুমোদিত জরুরি অনুরোধ</h2>
          {approvedQ.isLoading ? (
            <p className="text-sm text-muted-foreground">লোড হচ্ছে…</p>
          ) : (approvedQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">এই মুহূর্তে কোনো জরুরি অনুরোধ নেই।</p>
          ) : (
            (approvedQ.data ?? []).map((r) => <RequestCard key={r.id} r={r} />)
          )}
        </aside>
      </div>
    </div>
  );
}

function RequestCard({ r }: { r: BloodRequestRow }) {
  const phone = normalizePhone(r.phone);
  const wa = normalizePhone(r.whatsapp || r.phone);
  return (
    <Card className="border-red-200/70 dark:border-red-900/40">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">{r.patient_name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {r.bags_needed} ব্যাগ · {r.hospital_name}
            </div>
          </div>
          <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            {r.blood_group}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Calendar className="h-3 w-3" /> {formatBanglaDate(r.required_date)}
            {r.required_time ? ` · ${r.required_time}` : ""}
          </span>
          {r.hospital_location && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-3 w-3" /> {r.hospital_location}
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <a
            href={`tel:${phone}`}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            <Phone className="h-3 w-3" /> কল
          </a>
          <a
            href={`https://wa.me/${wa.replace(/^\+/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <MessageCircle className="h-3 w-3" /> WhatsApp
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
